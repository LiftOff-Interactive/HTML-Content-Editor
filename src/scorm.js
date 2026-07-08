/**
 * HCEScorm (Stage 11 F5) — SCORM 1.2 package export.
 *
 * Package layout:
 *   imsmanifest.xml — SCORM 1.2 manifest, one organization, one SCO
 *   index.html      — the standard interactive export plus an injected runtime
 *
 * Runtime behavior (mirrors what Brightspace/Moodle/SCORM Cloud expect):
 *   - Discovers the LMS API (window.API) up the parent/opener chain,
 *     LMSInitialize on load, LMSFinish on pagehide.
 *   - No Knowledge Checks → cmi.core.lesson_status = "completed" on load.
 *   - With Knowledge Checks → "incomplete" on load; each KC reports its FIRST
 *     submit via window.HCETrack.record(uid, correct). When all KCs have been
 *     answered once: cmi.core.score.raw = % correct, lesson_status =
 *     passed/failed against MASTERY (70). Retries never overwrite the first
 *     attempt — a retry is remediation, not a second scored try.
 *   - Without an LMS the shim is inert; the file still works as plain HTML.
 */
(function () {
  'use strict';

  var MASTERY = 70;

  function xmlEsc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  function slugify(text) {
    var slug = String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'course';
  }

  // ── Manifest ──────────────────────────────────────────────────────────────

  function buildManifest(title) {
    var t = xmlEsc(title || 'Exported Course');
    var id = 'HCE-' + slugify(title).replace(/[^A-Za-z0-9-]/g, '') .slice(0, 40);
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<manifest identifier="' + id + '" version="1.2"',
      '  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"',
      '  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"',
      '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd',
      '                      http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">',
      '  <metadata>',
      '    <schema>ADL SCORM</schema>',
      '    <schemaversion>1.2</schemaversion>',
      '  </metadata>',
      '  <organizations default="' + id + '-ORG">',
      '    <organization identifier="' + id + '-ORG">',
      '      <title>' + t + '</title>',
      '      <item identifier="' + id + '-ITEM" identifierref="' + id + '-RES" isvisible="true">',
      '        <title>' + t + '</title>',
      '        <adlcp:masteryscore>' + MASTERY + '</adlcp:masteryscore>',
      '      </item>',
      '    </organization>',
      '  </organizations>',
      '  <resources>',
      '    <resource identifier="' + id + '-RES" type="webcontent" adlcp:scormtype="sco" href="index.html">',
      '      <file href="index.html"/>',
      '    </resource>',
      '  </resources>',
      '</manifest>',
    ].join('\n');
  }

  // ── Runtime shim (injected into the exported page) ────────────────────────
  // Assembled without any literal "</script" so it can be embedded safely.

  function buildRuntime() {
    return [
      '(function(){',
      '"use strict";',
      'var api=null,initialized=false;',
      'function findAPI(win){var n=0;while(win&&n<12){try{if(win.API)return win.API;}catch(e){}if(win.parent===win)break;win=win.parent;n++;}return null;}',
      'try{api=findAPI(window);if(!api&&window.opener)api=findAPI(window.opener);}catch(e){}',
      'function set(k,v){if(!initialized)return;try{api.LMSSetValue(k,String(v));}catch(e){}}',
      'function commit(){if(!initialized)return;try{api.LMSCommit("");}catch(e){}}',
      'var answers={},total=0;',
      'function update(){',
      '  var ids=Object.keys(answers),correct=0;',
      '  ids.forEach(function(id){if(answers[id])correct++;});',
      '  var raw=total?Math.round((correct/total)*100):100;',
      '  set("cmi.core.score.min","0");set("cmi.core.score.max","100");',
      '  set("cmi.core.score.raw",raw);',
      '  if(ids.length>=total){set("cmi.core.lesson_status",raw>=' + MASTERY + '?"passed":"failed");}',
      '  commit();',
      '}',
      'window.HCETrack={',
      // First submit wins: retries are remediation, not a second scored attempt.
      '  record:function(id,correct){if(id in answers)return;answers[id]=!!correct;update();},',
      '  state:function(){return{total:total,answered:Object.keys(answers).length,answers:answers};}',
      '};',
      'function boot(){',
      '  total=document.querySelectorAll("[data-kc]").length;',
      '  if(!api)return;',
      '  try{initialized=String(api.LMSInitialize(""))!=="false";}catch(e){initialized=false;}',
      '  if(!initialized)return;',
      '  var prior="";',
      '  try{prior=String(api.LMSGetValue("cmi.core.lesson_status")||"");}catch(e){}',
      '  if(total===0){if(prior!=="completed"&&prior!=="passed")set("cmi.core.lesson_status","completed");}',
      '  else if(prior===""||prior==="not attempted"){set("cmi.core.lesson_status","incomplete");}',
      '  commit();',
      '}',
      'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot);}else{boot();}',
      'var finished=false;',
      'function finish(){if(finished||!initialized)return;finished=true;try{api.LMSFinish("");}catch(e){}}',
      'window.addEventListener("pagehide",finish);',
      'window.addEventListener("beforeunload",finish);',
      '})();',
    ].join('\n');
  }

  // ── Package build + download ──────────────────────────────────────────────

  function buildPackage(delta, title) {
    var html = window.HCEExport.buildExportHtml(delta, title, {});
    var shim = '<' + 'script>\n' + buildRuntime() + '\n</' + 'script>';
    // Splice before the LAST </body>: widget content can contain the literal
    // substring earlier in the document (e.g. a raw-html widget's <style>
    // block with "</body>" in a CSS comment), and inserting there would bury
    // the runtime as inert text — silently disabling all LMS tracking.
    var at = html.lastIndexOf('</body>');
    html = at === -1
      ? html + '\n' + shim
      : html.slice(0, at) + shim + '\n' + html.slice(at);
    return window.HCEZip.build([
      { name: 'imsmanifest.xml', text: buildManifest(title) },
      { name: 'index.html', text: html },
    ]);
  }

  function exportScorm() {
    var editor = window.contentEditor;
    if (!editor || !editor.quill) return;
    var delta = editor.quill.getContents();
    var title = (editor.getDocumentTitle && editor.getDocumentTitle()) || 'Exported Course';

    var bytes = buildPackage(delta, title);
    var blob = new Blob([bytes], { type: 'application/zip' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = slugify(title) + '-scorm12.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('export-scorm-btn');
    if (btn) btn.addEventListener('click', exportScorm);
  });

  window.HCEScorm = {
    exportScorm: exportScorm,
    buildPackage: buildPackage,
    buildManifest: buildManifest,
    buildRuntime: buildRuntime,
    MASTERY: MASTERY,
  };
})();
