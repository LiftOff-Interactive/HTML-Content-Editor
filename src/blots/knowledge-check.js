(function () {
  'use strict';

  let _instanceCount = 0;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function genId() {
    return 'opt-' + Date.now() + '-' + Math.floor(Math.random() * 9999);
  }

  class KnowledgeCheckBlot extends BaseWidgetBlot {
    static blotName          = 'knowledge-check';
    static tagName           = 'div';
    static widgetName        = 'knowledge-check';
    static widgetLabel       = 'Knowledge Check';
    static widgetIcon        = '❓';
    static widgetDescription = 'Multiple-choice or true/false self-assessment question';
    static defaultData = {
      _v: 1,
      questionType: 'multiple-choice',
      question: 'Enter your question here…',
      options: [
        { id: 'opt-1', text: 'Option A', correct: true,  feedback: '' },
        { id: 'opt-2', text: 'Option B', correct: false, feedback: '' },
        { id: 'opt-3', text: 'Option C', correct: false, feedback: '' },
      ],
      hint: '',
      allowRetry: true,
    };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'kc' + (++_instanceCount);
    }

    renderEditor(container, data) {
      const self = this;
      if (self._submitted    === undefined) self._submitted    = false;
      if (self._selectedIdx  === undefined) self._selectedIdx  = -1;
      if (self._hintVisible  === undefined) self._hintVisible  = false;

      const opts = data.options || [];
      const isTF = data.questionType === 'true-false';

      let optionsHtml = '';
      if (isTF) {
        opts.forEach(function (opt, idx) {
          const isSel = idx === self._selectedIdx;
          let stateClass = '';
          if (self._submitted) {
            if (isSel) {
              stateClass = ' kc-opt--' + (opt.correct ? 'correct' : 'incorrect');
            } else if (opt.correct && self._selectedIdx !== -1 && !opts[self._selectedIdx].correct) {
              stateClass = ' kc-opt--correct';
            }
          }
          const fbHtml = (self._submitted && opt.feedback)
            ? '<div class="kc-opt-feedback">' + opt.feedback + '</div>'
            : '';
          optionsHtml +=
            '<button type="button" class="kc-tf-btn' +
                (isSel ? ' is-selected' : '') + stateClass + '" ' +
                'data-opt-idx="' + idx + '" aria-pressed="' + isSel + '">' +
              esc(opt.text) + fbHtml +
            '</button>';
        });
      } else {
        opts.forEach(function (opt, idx) {
          const isSel = idx === self._selectedIdx;
          let stateClass = '';
          if (self._submitted) {
            if (isSel) {
              stateClass = ' kc-opt--' + (opt.correct ? 'correct' : 'incorrect');
            } else if (opt.correct && self._selectedIdx !== -1 && !opts[self._selectedIdx].correct) {
              stateClass = ' kc-opt--correct';
            }
          }
          const fbHtml = (self._submitted && opt.feedback)
            ? '<div class="kc-opt-feedback">' + opt.feedback + '</div>'
            : '';
          optionsHtml +=
            '<label class="kc-opt' + stateClass + '">' +
              '<input type="radio" name="kc-q-' + self._uid + '" value="' + idx + '"' +
                  (isSel ? ' checked' : '') + (self._submitted ? ' disabled' : '') + '>' +
              '<span class="kc-opt-text">' + esc(opt.text) + '</span>' +
              fbHtml +
            '</label>';
        });
      }

      const hintHtml = data.hint
        ? '<div class="kc-hint-row">' +
            '<button type="button" class="kc-hint-btn">' +
              (self._hintVisible ? 'Hide Hint' : 'Show Hint') +
            '</button>' +
            '<div class="kc-hint"' + (self._hintVisible ? '' : ' style="display:none;"') + '>' +
              (data.hint || '') +
            '</div>' +
          '</div>'
        : '';

      const actionHtml =
        '<div class="kc-actions">' +
          (!self._submitted
            ? '<button type="button" class="kc-submit-btn">Submit</button>'
            : '') +
          (self._submitted && data.allowRetry
            ? '<button type="button" class="kc-retry-btn">↺ Try Again</button>'
            : '') +
        '</div>';

      container.innerHTML =
        '<div class="kc-widget">' +
          '<div class="kc-bar">' +
            '<span class="kc-bar-label">❓ Knowledge Check</span>' +
            '<button class="kc-edit-btn" type="button">✎ Edit</button>' +
          '</div>' +
          '<div class="kc-body">' +
            '<fieldset class="kc-fieldset">' +
              '<legend class="kc-question">' + (data.question || '') + '</legend>' +
              hintHtml +
              '<div class="kc-options">' + optionsHtml + '</div>' +
              actionHtml +
            '</fieldset>' +
          '</div>' +
        '</div>';

      container.querySelector('.kc-body').addEventListener('click', function (e) {
        e.stopPropagation();
      });

      container.querySelector('.kc-edit-btn').addEventListener('click', function (e) {
        e.stopPropagation();
        self.edit(self.constructor.value(self.domNode));
      });

      const hintBtn = container.querySelector('.kc-hint-btn');
      if (hintBtn) {
        hintBtn.addEventListener('click', function () {
          self._hintVisible = !self._hintVisible;
          const hintEl = container.querySelector('.kc-hint');
          if (hintEl) hintEl.style.display = self._hintVisible ? 'block' : 'none';
          hintBtn.textContent = self._hintVisible ? 'Hide Hint' : 'Show Hint';
        });
      }

      if (isTF) {
        container.querySelectorAll('.kc-tf-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (self._submitted) return;
            self._selectedIdx = parseInt(btn.dataset.optIdx, 10);
            container.querySelectorAll('.kc-tf-btn').forEach(function (b) {
              const match = parseInt(b.dataset.optIdx, 10) === self._selectedIdx;
              b.classList.toggle('is-selected', match);
              b.setAttribute('aria-pressed', String(match));
            });
          });
        });
      } else {
        container.querySelectorAll('input[type="radio"]').forEach(function (radio) {
          radio.addEventListener('change', function () {
            self._selectedIdx = parseInt(radio.value, 10);
          });
        });
      }

      const submitBtn = container.querySelector('.kc-submit-btn');
      if (submitBtn) {
        submitBtn.addEventListener('click', function () {
          if (self._selectedIdx < 0) return;
          self._submitted = true;
          self.renderEditor(container, self.constructor.value(self.domNode));
        });
      }

      const retryBtn = container.querySelector('.kc-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', function () {
          self._submitted   = false;
          self._selectedIdx = -1;
          self._hintVisible = false;
          self.renderEditor(container, self.constructor.value(self.domNode));
        });
      }
    }

    renderExport(container, data) {
      const cs      = getComputedStyle(document.documentElement);
      const primary = cs.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const border  = cs.getPropertyValue('--color-border').trim()         || '#e2e8f0';
      const surface = cs.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = cs.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = cs.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = cs.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = cs.getPropertyValue('--widget-border-radius').trim() || '0.5rem';
      const ui      = cs.getPropertyValue('--font-family-ui').trim() || 'system-ui,sans-serif';

      const uid  = this._uid || ('kc' + (++_instanceCount));
      const opts = data.options || [];
      const isTF = data.questionType === 'true-false';

      // Obfuscate correct indices — stops casual source inspection
      const correctIndices = [];
      opts.forEach(function (opt, idx) { if (opt.correct) correctIndices.push(idx); });
      const answerKey = btoa(JSON.stringify(correctIndices));

      let optionsHtml = '';
      if (isTF) {
        opts.forEach(function (opt, idx) {
          const btnStyle =
            'display:block;width:100%;padding:14px 20px;margin-bottom:8px;' +
            'font-family:' + font + ';font-size:1em;color:' + text + ';' +
            'background:' + surface + ';border:2px solid ' + border + ';' +
            'border-radius:' + radius + ';cursor:pointer;text-align:left;' +
            'transition:border-color 0.15s,background 0.15s;';
          optionsHtml +=
            '<div class="hce-kc-opt" data-opt-idx="' + idx + '">' +
              '<button class="hce-kc-tf-btn" type="button" data-opt-idx="' + idx + '" ' +
                  'aria-pressed="false" style="' + btnStyle + '">' +
                esc(opt.text) +
              '</button>' +
              '<div class="hce-kc-fb" style="display:none;margin-top:8px;font-size:0.875em;' +
                  'color:' + muted + ';font-style:italic;">' +
                (opt.feedback || '') +
              '</div>' +
            '</div>';
        });
      } else {
        opts.forEach(function (opt, idx) {
          const labelStyle =
            'display:flex;align-items:flex-start;gap:10px;padding:12px 14px;' +
            'border:2px solid ' + border + ';border-radius:' + radius + ';cursor:pointer;' +
            'font-family:' + font + ';font-size:1em;color:' + text + ';' +
            'background:' + surface + ';transition:border-color 0.15s,background 0.15s;';
          optionsHtml +=
            '<div class="hce-kc-opt">' +
              '<label style="' + labelStyle + '">' +
                '<input type="radio" name="kc-q-' + uid + '" value="' + idx + '" ' +
                    'style="margin-top:3px;flex-shrink:0;accent-color:' + primary + ';"> ' +
                '<span style="flex:1;">' + esc(opt.text) + '</span>' +
              '</label>' +
              '<div class="hce-kc-fb" style="display:none;margin-top:6px;padding-left:22px;' +
                  'font-size:0.875em;color:' + muted + ';font-style:italic;">' +
                (opt.feedback || '') +
              '</div>' +
            '</div>';
        });
      }

      const hintHtml = data.hint
        ? '<div style="margin-bottom:14px;">' +
            '<button class="hce-kc-hint-btn" type="button" style="font-family:' + ui + ';' +
              'font-size:13px;color:' + primary + ';background:none;' +
              'border:1px solid ' + primary + ';border-radius:4px;cursor:pointer;padding:4px 10px;">' +
              'Show Hint' +
            '</button>' +
            '<div class="hce-kc-hint" style="display:none;margin-top:8px;padding:10px 14px;' +
              'background:' + surface + ';border:1px solid ' + border + ';' +
              'border-radius:' + radius + ';font-family:' + font + ';font-size:0.9em;' +
              'color:' + muted + ';font-style:italic;">' +
              (data.hint || '') +
            '</div>' +
          '</div>'
        : '';

      const submitStyle =
        'font-family:' + ui + ';font-size:14px;font-weight:600;' +
        'background:' + primary + ';color:#fff;border:none;' +
        'border-radius:' + radius + ';cursor:pointer;padding:10px 24px;margin-right:8px;';
      const retryStyle =
        'font-family:' + ui + ';font-size:14px;background:transparent;color:' + muted + ';' +
        'border:1px solid ' + border + ';border-radius:' + radius + ';cursor:pointer;' +
        'padding:10px 20px;display:none;';

      const retryHtml = data.allowRetry
        ? '<button class="hce-kc-retry" type="button" style="' + retryStyle + '">↺ Try Again</button>'
        : '';

      // Build inline script
      const script =
        '(function(){' +
          'var root=document.querySelector(\'[data-kc="' + uid + '"]\');' +
          'if(!root)return;' +
          'var key=JSON.parse(atob(\'' + answerKey + '\'));' +
          'var hintBtn=root.querySelector(".hce-kc-hint-btn");' +
          'var hintEl=root.querySelector(".hce-kc-hint");' +
          'var submitBtn=root.querySelector(".hce-kc-submit");' +
          'var retryBtn=root.querySelector(".hce-kc-retry");' +
          'var isTF=' + (isTF ? 'true' : 'false') + ';' +
          'var selIdx=-1;' +
          // Hint
          'if(hintBtn&&hintEl){hintBtn.addEventListener("click",function(){' +
            'var v=hintEl.style.display!=="none";' +
            'hintEl.style.display=v?"none":"block";' +
            'hintBtn.textContent=v?"Show Hint":"Hide Hint";' +
          '});}' +
          // TF selection
          'if(isTF){root.querySelectorAll(".hce-kc-tf-btn").forEach(function(btn){' +
            'btn.addEventListener("click",function(){' +
              'root.querySelectorAll(".hce-kc-tf-btn").forEach(function(b){' +
                'b.setAttribute("aria-pressed","false");' +
                'b.style.borderColor="' + border + '";b.style.background="' + surface + '";' +
              '});' +
              'btn.setAttribute("aria-pressed","true");' +
              'btn.style.borderColor="' + primary + '";btn.style.background="#eff6ff";' +
              'selIdx=parseInt(btn.dataset.optIdx,10);' +
            '});' +
          '});}' +
          // Submit
          'submitBtn.addEventListener("click",function(){' +
            'var idx=-1;' +
            'if(isTF){idx=selIdx;}' +
            'else{var r=root.querySelector("input[name=\\"kc-q-' + uid + '\\"]:checked");' +
              'if(r)idx=parseInt(r.value,10);}' +
            'if(idx<0)return;' +
            'var ok=key.indexOf(idx)!==-1;' +
            'root.querySelectorAll(".hce-kc-opt").forEach(function(opt,i){' +
              'var fb=opt.querySelector(".hce-kc-fb");if(fb)fb.style.display="block";' +
              'var el=isTF?opt.querySelector(".hce-kc-tf-btn"):opt.querySelector("label");' +
              'if(!el)return;' +
              'if(i===idx){' +
                'el.style.borderColor=ok?"#16a34a":"#dc2626";' +
                'el.style.background=ok?"#dcfce7":"#fee2e2";' +
              '}else if(key.indexOf(i)!==-1&&!ok){' +
                'el.style.borderColor="#16a34a";el.style.background="#dcfce7";' +
              '}' +
            '});' +
            'root.querySelectorAll("input").forEach(function(i){i.disabled=true;});' +
            'if(isTF)root.querySelectorAll(".hce-kc-tf-btn").forEach(function(b){b.disabled=true;});' +
            'submitBtn.style.display="none";' +
            'if(hintBtn)hintBtn.style.display="none";' +
            'if(hintEl)hintEl.style.display="none";' +
            'if(retryBtn)retryBtn.style.display="inline-block";' +
          '});' +
          // Retry
          'if(retryBtn){retryBtn.addEventListener("click",function(){' +
            'root.querySelectorAll("input").forEach(function(i){i.disabled=false;i.checked=false;});' +
            'if(isTF){root.querySelectorAll(".hce-kc-tf-btn").forEach(function(b){' +
              'b.disabled=false;b.setAttribute("aria-pressed","false");' +
              'b.style.borderColor="' + border + '";b.style.background="' + surface + '";' +
            '});}' +
            'selIdx=-1;' +
            'root.querySelectorAll(".hce-kc-opt").forEach(function(opt){' +
              'var fb=opt.querySelector(".hce-kc-fb");if(fb)fb.style.display="none";' +
              'var el=isTF?opt.querySelector(".hce-kc-tf-btn"):opt.querySelector("label");' +
              'if(el){el.style.borderColor="' + border + '";el.style.background="' + surface + '";}' +
            '});' +
            'submitBtn.style.display="inline-block";' +
            'if(hintBtn)hintBtn.style.display="inline-block";' +
            'retryBtn.style.display="none";' +
          '});}' +
        '})();';

      container.innerHTML =
        '<div data-kc="' + uid + '" style="border:1px solid ' + border + ';' +
            'border-radius:' + radius + ';padding:20px 24px;margin:8px 0;' +
            'background:' + surface + ';">' +
          '<fieldset style="border:none;padding:0;margin:0;">' +
            '<legend style="font-family:' + font + ';font-size:1.1em;font-weight:600;' +
                'color:' + text + ';margin-bottom:16px;display:block;' +
                'border:none;padding:0;width:100%;">' +
              (data.question || '') +
            '</legend>' +
            hintHtml +
            '<div>' + optionsHtml + '</div>' +
            '<div style="margin-top:16px;">' +
              '<button class="hce-kc-submit" type="button" style="' + submitStyle + '">Submit</button>' +
              retryHtml +
            '</div>' +
          '</fieldset>' +
        '</div>' +
        '<' + 'script>' + script + '</' + 'script>';
    }

    edit(data) {
      this._openEditModal(data);
    }

    _openEditModal(data) {
      const self    = this;
      const working = JSON.parse(JSON.stringify(data));
      let selOptIdx = 0;

      let questionRichField = null;
      let feedbackRichField = null;
      let hintRichField     = null;
      let currentRichOptIdx = -1;

      function saveAllRichFields() {
        if (questionRichField) {
          working.question = questionRichField.getHtml();
          questionRichField.destroy();
          questionRichField = null;
        }
        if (feedbackRichField) {
          if (currentRichOptIdx >= 0 && currentRichOptIdx < working.options.length) {
            working.options[currentRichOptIdx].feedback = feedbackRichField.getHtml();
          }
          feedbackRichField.destroy();
          feedbackRichField = null;
        }
        if (hintRichField) {
          working.hint = hintRichField.getHtml();
          hintRichField.destroy();
          hintRichField = null;
        }
        currentRichOptIdx = -1;
      }

      if (!working.options || working.options.length === 0) {
        working.options = JSON.parse(JSON.stringify(KnowledgeCheckBlot.defaultData.options));
      }
      if (!working.options.some(function (o) { return o.correct; })) {
        working.options[0].correct = true;
      }

      // Modal skeleton
      const overlay = document.createElement('div');
      overlay.className = 'widget-modal-overlay';

      const dialog = document.createElement('div');
      dialog.className = 'widget-modal';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'kc-edit-title');
      dialog.style.width = '640px';

      const header = document.createElement('div');
      header.className = 'widget-modal-header';
      const titleEl = document.createElement('span');
      titleEl.id = 'kc-edit-title';
      titleEl.textContent = 'Edit Knowledge Check';
      const closeX = document.createElement('button');
      closeX.className = 'widget-modal-close';
      closeX.type = 'button';
      closeX.setAttribute('aria-label', 'Close');
      closeX.innerHTML = '&times;';
      header.appendChild(titleEl);
      header.appendChild(closeX);

      const body = document.createElement('div');
      body.style.cssText = 'display:flex;min-height:380px;';

      const leftCol = document.createElement('div');
      leftCol.style.cssText =
        'width:200px;flex-shrink:0;border-right:1px solid var(--color-border);' +
        'display:flex;flex-direction:column;';

      const rightCol = document.createElement('div');
      rightCol.style.cssText =
        'flex:1;padding:16px;display:flex;flex-direction:column;gap:12px;overflow-y:auto;';

      body.appendChild(leftCol);
      body.appendChild(rightCol);

      const footer = document.createElement('div');
      footer.className = 'widget-modal-footer';
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'widget-modal-btn widget-modal-btn--cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      const saveBtn = document.createElement('button');
      saveBtn.className = 'widget-modal-btn widget-modal-btn--save';
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save';
      footer.appendChild(cancelBtn);
      footer.appendChild(saveBtn);

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Left col structure
      const optHeader = document.createElement('div');
      optHeader.style.cssText =
        'padding:8px 12px;font-size:11px;font-weight:600;text-transform:uppercase;' +
        'letter-spacing:0.05em;color:var(--color-text-muted);font-family:var(--font-family-ui);' +
        'border-bottom:1px solid var(--color-border);flex-shrink:0;';
      optHeader.textContent = 'Answer Options';

      const optListEl = document.createElement('div');
      optListEl.style.cssText = 'flex:1;overflow-y:auto;min-height:0;';

      const optFooter = document.createElement('div');
      optFooter.style.cssText =
        'border-top:1px solid var(--color-border);flex-shrink:0;display:flex;flex-direction:column;';

      const addOptBtn = document.createElement('button');
      addOptBtn.type = 'button';
      addOptBtn.textContent = '+ Add Option';
      addOptBtn.style.cssText =
        'padding:8px 10px;font-size:12px;font-family:var(--font-family-ui);' +
        'border:none;background:transparent;cursor:pointer;color:var(--color-primary);text-align:left;';

      // Settings: question type
      const settingsWrap = document.createElement('div');
      settingsWrap.style.cssText =
        'padding:10px 12px;border-top:1px solid var(--color-border);' +
        'font-family:var(--font-family-ui);font-size:12px;display:flex;flex-direction:column;gap:6px;';

      const typeHeading = document.createElement('div');
      typeHeading.style.cssText =
        'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;' +
        'color:var(--color-text-muted);margin-bottom:2px;';
      typeHeading.textContent = 'Question Type';
      settingsWrap.appendChild(typeHeading);

      function makeTypeRadio(label, value) {
        const row = document.createElement('label');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;color:var(--color-text);';
        const rb = document.createElement('input');
        rb.type = 'radio';
        rb.name = 'kc-qtype';
        rb.value = value;
        rb.checked = working.questionType === value;
        rb.addEventListener('change', function () {
          if (!rb.checked) return;
          const prev = working.questionType;
          working.questionType = value;
          if (value === 'true-false' && prev !== 'true-false') {
            const firstCorrect = working.options.findIndex(function (o) { return o.correct; });
            working.options = [
              { id: genId(), text: 'True',  correct: firstCorrect === 0, feedback: (working.options[0] || {}).feedback || '' },
              { id: genId(), text: 'False', correct: firstCorrect !== 0, feedback: (working.options[1] || {}).feedback || '' },
            ];
            if (!working.options.some(function (o) { return o.correct; })) {
              working.options[0].correct = true;
            }
          }
          selOptIdx = 0;
          renderOptList();
          renderRight();
        });
        row.appendChild(rb);
        row.appendChild(document.createTextNode(label));
        return row;
      }

      settingsWrap.appendChild(makeTypeRadio('Multiple Choice', 'multiple-choice'));
      settingsWrap.appendChild(makeTypeRadio('True / False', 'true-false'));

      optFooter.appendChild(addOptBtn);
      optFooter.appendChild(settingsWrap);

      leftCol.appendChild(optHeader);
      leftCol.appendChild(optListEl);
      leftCol.appendChild(optFooter);

      // Render functions
      function renderOptList() {
        optListEl.innerHTML = '';
        const isTF = working.questionType === 'true-false';
        working.options.forEach(function (opt, idx) {
          const isSel = idx === selOptIdx;
          const row = document.createElement('div');
          row.style.cssText =
            'display:flex;align-items:center;padding:7px 10px;cursor:pointer;gap:4px;' +
            'font-size:12px;font-family:var(--font-family-ui);' +
            (isSel ? 'background:var(--color-primary);color:#fff;' : 'color:var(--color-text);');

          const correctDot = document.createElement('span');
          correctDot.style.cssText =
            'width:14px;height:14px;border-radius:50%;flex-shrink:0;font-size:9px;' +
            'display:flex;align-items:center;justify-content:center;font-weight:700;' +
            (opt.correct
              ? 'background:#16a34a;color:#fff;'
              : 'background:' + (isSel ? 'rgba(255,255,255,0.2)' : 'var(--color-border)') + ';color:transparent;');
          correctDot.textContent = '✓';

          const textSpan = document.createElement('span');
          textSpan.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
          textSpan.textContent = opt.text || '(empty)';

          row.appendChild(correctDot);
          row.appendChild(textSpan);

          if (!isTF) {
            function smBtn(symbol) {
              const b = document.createElement('button');
              b.type = 'button';
              b.textContent = symbol;
              b.style.cssText =
                'background:none;border:none;cursor:pointer;font-size:9px;padding:0 1px;line-height:1;' +
                'color:' + (isSel ? 'rgba(255,255,255,0.75)' : 'var(--color-text-muted)') + ';';
              return b;
            }
            const upBtn   = smBtn('▲');
            const downBtn = smBtn('▼');
            const delBtn  = smBtn('✕');
            delBtn.style.fontSize = '10px';

            upBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              if (idx === 0) return;
              working.options.splice(idx - 1, 0, working.options.splice(idx, 1)[0]);
              selOptIdx = idx - 1;
              renderOptList(); renderRight();
            });
            downBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              if (idx === working.options.length - 1) return;
              working.options.splice(idx + 1, 0, working.options.splice(idx, 1)[0]);
              selOptIdx = idx + 1;
              renderOptList(); renderRight();
            });
            delBtn.addEventListener('click', function (e) {
              e.stopPropagation();
              if (working.options.length <= 2) return;
              const wasCorrect = working.options[idx].correct;
              working.options.splice(idx, 1);
              if (wasCorrect) working.options[0].correct = true;
              if (selOptIdx >= working.options.length) selOptIdx = working.options.length - 1;
              renderOptList(); renderRight();
            });
            row.appendChild(upBtn);
            row.appendChild(downBtn);
            row.appendChild(delBtn);
          }

          row.addEventListener('click', function () {
            selOptIdx = idx;
            renderOptList(); renderRight();
          });
          optListEl.appendChild(row);
        });

        const isTFMode = working.questionType === 'true-false';
        const atMax    = working.options.length >= 8;
        addOptBtn.disabled    = isTFMode || atMax;
        addOptBtn.style.opacity = (isTFMode || atMax) ? '0.4' : '1';
        addOptBtn.style.cursor  = (isTFMode || atMax) ? 'default' : 'pointer';
      }

      function renderRight() {
        saveAllRichFields();
        rightCol.innerHTML = '';
        currentRichOptIdx = selOptIdx;

        // Question (rich)
        const qWrap = document.createElement('div');
        qWrap.className = 'widget-modal-field';
        const qLabel = document.createElement('label');
        qLabel.className = 'widget-modal-label';
        qLabel.textContent = 'Question';
        const qMount = document.createElement('div');
        questionRichField = new RichTextField(qMount, working.question || '');
        qWrap.appendChild(qLabel);
        qWrap.appendChild(qMount);
        rightCol.appendChild(qWrap);

        const opt = working.options[selOptIdx];
        if (!opt) return;

        const hr1 = document.createElement('hr');
        hr1.style.cssText = 'border:none;border-top:1px solid var(--color-border);margin:0;';
        rightCol.appendChild(hr1);

        const optHeading = document.createElement('div');
        optHeading.style.cssText =
          'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;' +
          'color:var(--color-text-muted);font-family:var(--font-family-ui);';
        optHeading.textContent = 'Option ' + (selOptIdx + 1);
        rightCol.appendChild(optHeading);

        // Option text
        const optTxtWrap = document.createElement('div');
        optTxtWrap.className = 'widget-modal-field';
        const optTxtLabel = document.createElement('label');
        optTxtLabel.className = 'widget-modal-label';
        optTxtLabel.textContent = 'Answer text';
        const optTxtInput = document.createElement('input');
        optTxtInput.className = 'widget-modal-input';
        optTxtInput.type = 'text';
        optTxtInput.value = opt.text;
        optTxtInput.placeholder = 'e.g. Option A';
        if (working.questionType === 'true-false') {
          optTxtInput.disabled = true;
          optTxtInput.style.opacity = '0.5';
        } else {
          optTxtInput.addEventListener('input', function () {
            working.options[selOptIdx].text = optTxtInput.value;
            renderOptList();
          });
        }
        optTxtWrap.appendChild(optTxtLabel);
        optTxtWrap.appendChild(optTxtInput);
        rightCol.appendChild(optTxtWrap);

        // Mark correct checkbox
        const correctRow = document.createElement('label');
        correctRow.style.cssText =
          'display:flex;align-items:center;gap:8px;cursor:pointer;' +
          'font-family:var(--font-family-ui);font-size:13px;color:var(--color-text);';
        const correctCb = document.createElement('input');
        correctCb.type = 'checkbox';
        correctCb.checked = opt.correct;
        correctCb.addEventListener('change', function () {
          working.options.forEach(function (o, i) {
            o.correct = i === selOptIdx ? correctCb.checked : false;
          });
          if (!working.options.some(function (o) { return o.correct; })) {
            correctCb.checked = true;
            working.options[selOptIdx].correct = true;
          }
          renderOptList();
        });
        correctRow.appendChild(correctCb);
        correctRow.appendChild(document.createTextNode('This is the correct answer'));
        rightCol.appendChild(correctRow);

        // Feedback (rich)
        const fbWrap = document.createElement('div');
        fbWrap.className = 'widget-modal-field';
        const fbLabel = document.createElement('label');
        fbLabel.className = 'widget-modal-label';
        fbLabel.textContent = 'Feedback (shown after submit)';
        const fbMount = document.createElement('div');
        feedbackRichField = new RichTextField(fbMount, opt.feedback || '');
        fbWrap.appendChild(fbLabel);
        fbWrap.appendChild(fbMount);
        rightCol.appendChild(fbWrap);

        const hr2 = document.createElement('hr');
        hr2.style.cssText = 'border:none;border-top:1px solid var(--color-border);margin:0;';
        rightCol.appendChild(hr2);

        // Hint (rich)
        const hintWrap = document.createElement('div');
        hintWrap.className = 'widget-modal-field';
        const hintLabel = document.createElement('label');
        hintLabel.className = 'widget-modal-label';
        hintLabel.textContent = 'Hint (optional)';
        const hintMount = document.createElement('div');
        hintRichField = new RichTextField(hintMount, working.hint || '');
        hintWrap.appendChild(hintLabel);
        hintWrap.appendChild(hintMount);
        rightCol.appendChild(hintWrap);

        // Allow retry
        const retryRow = document.createElement('label');
        retryRow.style.cssText =
          'display:flex;align-items:center;gap:8px;cursor:pointer;' +
          'font-family:var(--font-family-ui);font-size:13px;color:var(--color-text);';
        const retryCb = document.createElement('input');
        retryCb.type = 'checkbox';
        retryCb.checked = working.allowRetry !== false;
        retryCb.addEventListener('change', function () { working.allowRetry = retryCb.checked; });
        retryRow.appendChild(retryCb);
        retryRow.appendChild(document.createTextNode('Allow retry'));
        rightCol.appendChild(retryRow);
      }

      addOptBtn.addEventListener('click', function () {
        if (working.options.length >= 8 || working.questionType === 'true-false') return;
        working.options.push({ id: genId(), text: '', correct: false, feedback: '' });
        selOptIdx = working.options.length - 1;
        renderOptList(); renderRight();
        requestAnimationFrame(function () {
          const inp = rightCol.querySelector('.widget-modal-input');
          if (inp) inp.focus();
        });
      });

      function close(save) {
        saveAllRichFields();
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (!save) return;
        if (!working.options.some(function (o) { return o.correct; })) {
          working.options[0].correct = true;
        }
        self._submitted   = false;
        self._selectedIdx = -1;
        self._hintVisible = false;
        self.updateData(working);
      }

      function onKey(e) {
        if (e.key === 'Escape') { e.preventDefault(); close(false); }
      }

      closeX.addEventListener('click',   function () { close(false); });
      cancelBtn.addEventListener('click', function () { close(false); });
      saveBtn.addEventListener('click',   function () { close(true); });
      overlay.addEventListener('click',  function (e) { if (e.target === overlay) close(false); });
      document.addEventListener('keydown', onKey);

      renderOptList();
      renderRight();
    }
  }

  WidgetRegistry.register(KnowledgeCheckBlot);
})();
