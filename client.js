/* 刷题模式 Client 半 — 由 tools/build-client.mjs 生成，勿手改。 */
window.__ModuleLoader__.load({
	id: "dsh-practice-mode",
	factory(require) {
		const React = require('react');
		const h = React.createElement;
		const __DSP_CSS__ = "/* ==== src/client/css/base.css ==== */\n/* 刷题模式 — 基础样式（Lead 维护）。颜色只使用 --dsw-alias-* 主题 token。 */\n\n.dsp-app {\n\tbox-sizing: border-box;\n\tdisplay: flex;\n\theight: 100%;\n\tmin-height: 0;\n\twidth: 100%;\n\toverflow: hidden;\n\tpadding-top: var(--dsh-frame-top-clearance, 0px);\n\tbackground: var(--dsw-alias-bg-base);\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 13px;\n\tline-height: 20px;\n}\n\n.dsp-app *,\n.dsp-app *::before,\n.dsp-app *::after {\n\tbox-sizing: border-box;\n}\n\n.dsp-app button,\n.dsp-app input,\n.dsp-app textarea,\n.dsp-app select {\n\tfont-family: inherit;\n}\n\n.dsp-icon {\n\tdisplay: block;\n\tflex: none;\n\tvertical-align: middle;\n}\n\n.dsp-main {\n\tdisplay: flex;\n\tflex-direction: column;\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tmin-height: 0;\n\tposition: relative;\n}\n\n.dsp-rail {\n\tdisplay: flex;\n\tflex-direction: column;\n\twidth: 236px;\n\tflex: none;\n\tmin-height: 0;\n\tborder-right: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-specific-sidebar-fill, var(--dsw-alias-bg-layer-1));\n}\n\n.dsp-chat {\n\tdisplay: flex;\n\tflex-direction: column;\n\twidth: 384px;\n\tflex: none;\n\tmin-height: 0;\n\t/* 具体卡片外观（圆角/描边/背景/外边距）由 chat.css 负责 */\n}\n\n.dsp-scroll {\n\toverflow-y: auto;\n\toverflow-x: hidden;\n\tmin-height: 0;\n\tflex: 1 1 auto;\n}\n\n.dsp-pad {\n\tpadding-left: 20px;\n\tpadding-right: 20px;\n}\n\n.dsp-muted {\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-faint {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-small {\n\tfont-size: 12px;\n\tline-height: 18px;\n}\n\n.dsp-mono {\n\tfont-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n\tfont-size: 12px;\n}\n\n.dsp-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-row-between {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tmin-width: 0;\n}\n\n.dsp-col {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n}\n\n.dsp-gap-4 { gap: 4px; }\n.dsp-gap-6 { gap: 6px; }\n.dsp-gap-8 { gap: 8px; }\n.dsp-gap-10 { gap: 10px; }\n.dsp-gap-12 { gap: 12px; }\n.dsp-gap-16 { gap: 16px; }\n\n.dsp-divider {\n\theight: 0.5px;\n\tbackground: var(--dsw-alias-border-l1);\n\tmargin: 12px 0;\n\tborder: 0;\n}\n\n.dsp-truncate {\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n\twhite-space: nowrap;\n\tmin-width: 0;\n}\n\n.dsp-clamp-2 {\n\tdisplay: -webkit-box;\n\t-webkit-line-clamp: 2;\n\t-webkit-box-orient: vertical;\n\toverflow: hidden;\n}\n\n.dsp-card {\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 10px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tpadding: 14px 16px;\n\tmin-width: 0;\n}\n\n.dsp-card-flat {\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tpadding: 10px 12px;\n\tmin-width: 0;\n}\n\n.dsp-section-title {\n\tmargin: 0;\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tline-height: 22px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-section-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tmargin-bottom: 10px;\n}\n\n.dsp-kicker {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tletter-spacing: 0.04em;\n\ttext-transform: uppercase;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-page {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-height: 0;\n\theight: 100%;\n}\n\n.dsp-page-head {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tjustify-content: space-between;\n\tgap: 16px;\n\tpadding: 22px 24px 14px;\n\tflex: none;\n}\n\n.dsp-page-title {\n\tmargin: 0;\n\tfont-size: 20px;\n\tline-height: 28px;\n\tfont-weight: 600;\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-page-sub {\n\tmargin: 3px 0 0;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 12.5px;\n\tline-height: 19px;\n}\n\n.dsp-page-body {\n\tpadding: 6px 24px 32px;\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 18px;\n\tmin-height: 0;\n}\n\n/* ---------------------------------------------------------------- */\n/* 按钮                                                              */\n/* ---------------------------------------------------------------- */\n\n.dsp-btn {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 6px;\n\twhite-space: nowrap;\n\tborder-radius: 8px;\n\tborder: 0.5px solid transparent;\n\tcursor: pointer;\n\theight: 30px;\n\tpadding: 0 12px;\n\tfont-size: 12.5px;\n\tfont-weight: 500;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-primary);\n\tbackground: transparent;\n\ttransition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;\n}\n\n.dsp-btn:disabled {\n\topacity: 0.5;\n\tcursor: default;\n}\n\n.dsp-btn-primary {\n\tbackground: var(--dsw-alias-brand-primary);\n\tcolor: var(--dsw-alias-label-primary-foreground, #ffffff);\n}\n\n.dsp-btn-primary:hover:not(:disabled) {\n\tfilter: brightness(1.06);\n}\n\n.dsp-btn-secondary {\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tborder-color: var(--dsw-alias-border-l1);\n}\n\n.dsp-btn-secondary:hover:not(:disabled),\n.dsp-btn-ghost:hover:not(:disabled) {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-btn-ghost {\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-btn-danger {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 32%, transparent);\n}\n\n.dsp-btn-danger:hover:not(:disabled) {\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);\n}\n\n.dsp-btn-sm {\n\theight: 26px;\n\tpadding: 0 9px;\n\tfont-size: 12px;\n\tborder-radius: 7px;\n}\n\n.dsp-btn-lg {\n\theight: 36px;\n\tpadding: 0 16px;\n\tfont-size: 13.5px;\n\tborder-radius: 9px;\n}\n\n.dsp-btn-block {\n\twidth: 100%;\n}\n\n.dsp-btn:focus-visible,\n.dsp-icon-btn:focus-visible,\n.dsp-tag button:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-icon-btn {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: 26px;\n\theight: 26px;\n\tflex: none;\n\tborder-radius: 7px;\n\tborder: 0;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-secondary);\n\tcursor: pointer;\n\tpadding: 0;\n}\n\n.dsp-icon-btn:hover:not(:disabled) {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-icon-btn:disabled {\n\topacity: 0.45;\n\tcursor: default;\n}\n\n.dsp-icon-btn-danger:hover:not(:disabled) {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);\n}\n\n.dsp-icon-btn-active {\n\tcolor: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n}\n\n/* ---------------------------------------------------------------- */\n/* 表单                                                              */\n/* ---------------------------------------------------------------- */\n\n.dsp-field {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\tmin-width: 0;\n}\n\n.dsp-field-label {\n\tfont-size: 12.5px;\n\tfont-weight: 500;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-field-optional {\n\tmargin-left: 4px;\n\tfont-weight: 400;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-field-hint {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-field-error {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-input,\n.dsp-textarea,\n.dsp-select {\n\twidth: 100%;\n\tborder: 0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 13px;\n\tline-height: 20px;\n\tpadding: 7px 10px;\n\toutline: none;\n\tmin-width: 0;\n}\n\n.dsp-input {\n\theight: 34px;\n}\n\n.dsp-textarea {\n\tresize: vertical;\n\tmin-height: 72px;\n}\n\n.dsp-input:focus,\n.dsp-textarea:focus,\n.dsp-select:focus {\n\tborder-color: var(--dsw-alias-brand-primary);\n}\n\n.dsp-input::placeholder,\n.dsp-textarea::placeholder {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n/* ---------------------------------------------------------------- */\n/* 标签 / 徽标                                                       */\n/* ---------------------------------------------------------------- */\n\n.dsp-tag {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 4px;\n\theight: 20px;\n\tpadding: 0 7px;\n\tborder-radius: 999px;\n\tfont-size: 11px;\n\tline-height: 18px;\n\twhite-space: nowrap;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-secondary);\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n.dsp-tag-neutral { color: var(--dsw-alias-label-secondary); }\n.dsp-tag-brand {\n\tcolor: var(--dsw-alias-brand-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent);\n}\n.dsp-tag-success {\n\tcolor: var(--dsw-alias-state-success-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 30%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent);\n}\n.dsp-tag-error {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 30%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);\n}\n.dsp-tag-warn {\n\tcolor: var(--dsw-alias-state-warn-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 32%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 10%, transparent);\n}\n\n.dsp-dot {\n\tdisplay: inline-block;\n\twidth: 6px;\n\theight: 6px;\n\tborder-radius: 50%;\n\tbackground: currentColor;\n\tflex: none;\n}\n\n/* ---------------------------------------------------------------- */\n/* 空态 / 加载                                                        */\n/* ---------------------------------------------------------------- */\n\n.dsp-empty {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 8px;\n\tpadding: 44px 20px;\n\ttext-align: center;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-empty-icon {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\topacity: 0.8;\n}\n\n.dsp-empty-title {\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-empty-text {\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\tmax-width: 420px;\n}\n\n.dsp-empty-action {\n\tmargin-top: 6px;\n}\n\n.dsp-spinner {\n\tdisplay: inline-block;\n\tborder-radius: 50%;\n\tborder: 2px solid color-mix(in srgb, var(--dsw-alias-label-primary) 15%, transparent);\n\tborder-top-color: var(--dsw-alias-brand-primary);\n\tanimation: dsp-spin 0.8s linear infinite;\n}\n\n@keyframes dsp-spin {\n\tto { transform: rotate(360deg); }\n}\n\n@keyframes dsp-fade-in {\n\tfrom { opacity: 0; transform: translateY(2px); }\n\tto { opacity: 1; transform: none; }\n}\n\n.dsp-progress {\n\theight: 4px;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\toverflow: hidden;\n}\n\n.dsp-progress-fill {\n\theight: 100%;\n\tborder-radius: inherit;\n\tbackground: var(--dsw-alias-brand-primary);\n\ttransition: width 0.3s ease;\n}\n\n/* ---------------------------------------------------------------- */\n/* 分段控件                                                           */\n/* ---------------------------------------------------------------- */\n\n.dsp-segmented {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tpadding: 2px;\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tgap: 2px;\n}\n\n.dsp-segmented-item {\n\theight: 24px;\n\tpadding: 0 10px;\n\tborder: 0;\n\tborder-radius: 6px;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 12px;\n\tcursor: pointer;\n\twhite-space: nowrap;\n}\n\n.dsp-segmented-item:hover {\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-segmented-active {\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-primary);\n\tbox-shadow: 0 0 0 0.5px var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n}\n\n.dsp-toggle {\n\tposition: relative;\n\twidth: 34px;\n\theight: 20px;\n\tborder-radius: 999px;\n\tborder: 0;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcursor: pointer;\n\tpadding: 0;\n\tflex: none;\n}\n\n.dsp-toggle-on {\n\tbackground: var(--dsw-alias-brand-primary);\n}\n\n.dsp-toggle-thumb {\n\tposition: absolute;\n\ttop: 2px;\n\tleft: 2px;\n\twidth: 16px;\n\theight: 16px;\n\tborder-radius: 50%;\n\tbackground: var(--dsw-alias-label-primary-foreground, #ffffff);\n\ttransition: left 0.14s ease;\n}\n\n.dsp-toggle-on .dsp-toggle-thumb {\n\tleft: 16px;\n}\n\n/* ---------------------------------------------------------------- */\n/* 弹窗                                                               */\n/* ---------------------------------------------------------------- */\n\n.dsp-modal-mask {\n\tposition: fixed;\n\tinset: 0;\n\tz-index: 1200;\n\tbackground: rgba(0, 0, 0, 0.55);\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tpadding: 24px;\n}\n\n.dsp-modal {\n\twidth: min(520px, 100%);\n\tmax-height: min(680px, 90vh);\n\tdisplay: flex;\n\tflex-direction: column;\n\tbackground: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 14px;\n\tbox-shadow: var(--dsw-elevation-prominent, 0 18px 50px rgba(0, 0, 0, 0.22));\n\tanimation: dsp-fade-in 0.16s ease;\n\tmin-width: 0;\n\toverflow: hidden;\n}\n\n.dsp-modal-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 12px;\n\tpadding: 14px 16px 10px;\n\tflex: none;\n}\n\n.dsp-modal-title {\n\tfont-size: 15px;\n\tfont-weight: 600;\n\tline-height: 22px;\n\tmin-width: 0;\n}\n\n.dsp-modal-body {\n\tpadding: 4px 16px 16px;\n\toverflow-y: auto;\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 12px;\n\tmin-height: 0;\n}\n\n.dsp-modal-foot {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 8px;\n\tpadding: 12px 16px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n\tflex: none;\n}\n\n/* ---------------------------------------------------------------- */\n/* Toast                                                              */\n/* ---------------------------------------------------------------- */\n\n.dsp-toasts {\n\tposition: fixed;\n\tleft: 50%;\n\tbottom: calc(28px + var(--dsh-frame-bottom-clearance, 0px));\n\ttransform: translateX(-50%);\n\tz-index: 1400;\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\talign-items: center;\n\tpointer-events: none;\n\tmax-width: min(560px, calc(100vw - 32px));\n}\n\n.dsp-toast {\n\tpointer-events: auto;\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tpadding: 8px 14px;\n\tborder-radius: 9px;\n\tbackground: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tbox-shadow: var(--dsw-elevation-prominent, 0 10px 26px rgba(0, 0, 0, 0.16));\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\tanimation: dsp-fade-in 0.16s ease;\n\tmax-width: 100%;\n}\n\n.dsp-toast-success { border-left: 3px solid var(--dsw-alias-state-success-primary); }\n.dsp-toast-error { border-left: 3px solid var(--dsw-alias-state-error-primary); }\n.dsp-toast-warn { border-left: 3px solid var(--dsw-alias-state-warn-primary); }\n.dsp-toast-info { border-left: 3px solid var(--dsw-alias-brand-primary); }\n\n/* ---------------------------------------------------------------- */\n/* Markdown                                                           */\n/* ---------------------------------------------------------------- */\n\n.dsp-md {\n\tfont-size: 13px;\n\tline-height: 21px;\n\tcolor: var(--dsw-alias-label-primary);\n\toverflow-wrap: anywhere;\n}\n\n.dsp-md-p {\n\tmargin: 0 0 8px;\n}\n\n.dsp-md-p:last-child {\n\tmargin-bottom: 0;\n}\n\n.dsp-md-h {\n\tmargin: 14px 0 6px;\n\tfont-weight: 600;\n\tline-height: 24px;\n}\n\n.dsp-md-h:first-child {\n\tmargin-top: 0;\n}\n\n.dsp-md-h1 { font-size: 18px; }\n.dsp-md-h2 { font-size: 16px; }\n.dsp-md-h3 { font-size: 14.5px; }\n.dsp-md-h4,\n.dsp-md-h5,\n.dsp-md-h6 { font-size: 13.5px; }\n\n.dsp-md-list {\n\tmargin: 4px 0 8px;\n\tpadding-left: 20px;\n}\n\n.dsp-md-list li {\n\tmargin: 2px 0;\n}\n\n.dsp-md-code {\n\tfont-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n\tfont-size: 12px;\n\tpadding: 1px 5px;\n\tborder-radius: 5px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n.dsp-md-pre {\n\tmargin: 8px 0;\n\tpadding: 10px 12px;\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\toverflow-x: auto;\n}\n\n.dsp-md-block-code {\n\tfont-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n\tfont-size: 12px;\n\tline-height: 18px;\n\twhite-space: pre;\n}\n\n.dsp-md-quote {\n\tmargin: 6px 0;\n\tpadding: 2px 0 2px 12px;\n\tborder-left: 2px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-md-hr {\n\tborder: 0;\n\theight: 0.5px;\n\tbackground: var(--dsw-alias-border-l1);\n\tmargin: 12px 0;\n}\n\n.dsp-md-table-wrap {\n\toverflow-x: auto;\n\tmargin: 8px 0;\n}\n\n.dsp-md-table {\n\tborder-collapse: collapse;\n\tfont-size: 12.5px;\n\tmin-width: 100%;\n}\n\n.dsp-md-table th,\n.dsp-md-table td {\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tpadding: 5px 9px;\n\ttext-align: left;\n\tvertical-align: top;\n}\n\n.dsp-md-table th {\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tfont-weight: 600;\n}\n\n.dsp-md a {\n\tcolor: var(--dsw-alias-brand-primary);\n\ttext-decoration: none;\n}\n\n.dsp-md a:hover {\n\ttext-decoration: underline;\n}\n\n/* ---------------------------------------------------------------- */\n/* 框选提问浮层                                                       */\n/* ---------------------------------------------------------------- */\n\n.dsp-selection-action {\n\tposition: fixed;\n\tz-index: 1300;\n\ttransform: translate(-50%, -100%);\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 4px;\n\tpadding: 4px 5px 4px 9px;\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-overlay, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tbox-shadow: var(--dsw-elevation-prominent, 0 10px 26px rgba(0, 0, 0, 0.18));\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 12px;\n\twhite-space: nowrap;\n\tanimation: dsp-fade-in 0.12s ease;\n}\n\n.dsp-selection-action::after {\n\tcontent: '';\n\tposition: absolute;\n\tleft: 50%;\n\tbottom: -5px;\n\twidth: 8px;\n\theight: 8px;\n\ttransform: translateX(-50%) rotate(45deg);\n\tbackground: inherit;\n\tborder-right: 0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n}\n\n/* ---------------------------------------------------------------- */\n/* 滚动条（跟随宿主风格，细而低调）                                   */\n/* ---------------------------------------------------------------- */\n\n.dsp-app ::-webkit-scrollbar {\n\twidth: 10px;\n\theight: 10px;\n}\n\n.dsp-app ::-webkit-scrollbar-thumb {\n\tbackground: var(--dsh-scrollbar-thumb, color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent));\n\tborder-radius: 8px;\n\tborder: 2px solid transparent;\n\tbackground-clip: content-box;\n}\n\n.dsp-app ::-webkit-scrollbar-thumb:hover {\n\tbackground: var(--dsh-scrollbar-thumb-hover, color-mix(in srgb, var(--dsw-alias-label-primary) 28%, transparent));\n\tbackground-clip: content-box;\n\tborder: 2px solid transparent;\n}\n\n.dsp-app ::-webkit-scrollbar-track {\n\tbackground: transparent;\n}\n\n.dsp-app ::-webkit-scrollbar-corner {\n\tbackground: transparent;\n}\n\n@media (prefers-reduced-motion: reduce) {\n\t.dsp-app *,\n\t.dsp-app *::before,\n\t.dsp-app *::after {\n\t\tanimation: none !important;\n\t\ttransition: none !important;\n\t}\n}\n\n/* ---------------------------------------------------------------- */\n/* 启动 / 欢迎页 / 侧边栏图标                                         */\n/* ---------------------------------------------------------------- */\n\n.dsp-app-boot {\n\talign-items: center;\n\tjustify-content: center;\n}\n\n.dsp-boot {\n\tdisplay: flex;\n\theight: 100%;\n\twidth: 100%;\n\talign-items: center;\n\tjustify-content: center;\n\tpadding: 40px;\n}\n\n.dsp-boot-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tgap: 14px;\n\tpadding: 36px 44px;\n\tborder-radius: 16px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tmin-width: 300px;\n}\n\n.dsp-boot-logo,\n.dsp-welcome-logo {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-boot-title {\n\tfont-size: 16px;\n\tfont-weight: 600;\n}\n\n.dsp-panel-icon {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: 100%;\n\theight: 100%;\n\tline-height: 0;\n\tcolor: inherit;\n}\n\n.dsp-welcome {\n\theight: 100%;\n\toverflow-y: auto;\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tpadding: 32px 28px;\n}\n\n.dsp-welcome-hero {\n\twidth: 100%;\n\tmax-width: 720px;\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\ttext-align: center;\n\tgap: 10px;\n\tpadding: 28px 20px;\n}\n\n.dsp-welcome-title {\n\tmargin: 6px 0 0;\n\tfont-size: 26px;\n\tline-height: 34px;\n\tfont-weight: 650;\n\tletter-spacing: 0.01em;\n}\n\n.dsp-welcome-sub {\n\tmargin: 0;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 13.5px;\n\tline-height: 21px;\n\tmax-width: 560px;\n}\n\n.dsp-welcome-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 10px;\n\tmargin: 14px 0 22px;\n\tflex-wrap: wrap;\n\tjustify-content: center;\n}\n\n.dsp-welcome-grid {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(2, minmax(0, 1fr));\n\tgap: 10px;\n\twidth: 100%;\n\ttext-align: left;\n}\n\n.dsp-welcome-cell {\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 12px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tpadding: 14px 16px;\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 4px;\n\tmin-width: 0;\n}\n\n.dsp-welcome-cell-icon {\n\tcolor: var(--dsw-alias-brand-primary);\n\tmargin-bottom: 2px;\n}\n\n.dsp-welcome-cell-title {\n\tfont-size: 13.5px;\n\tfont-weight: 600;\n}\n\n.dsp-welcome-cell-text {\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n@media (max-width: 720px) {\n\t.dsp-welcome-grid {\n\t\tgrid-template-columns: minmax(0, 1fr);\n\t}\n}\n\n/* ---------------------------------------------------------------- */\n/* 窄窗口自适应                                                       */\n/* ---------------------------------------------------------------- */\n\n@media (max-width: 1500px) {\n\t.dsp-rail { width: 214px; }\n\t.dsp-chat { width: 356px; }\n}\n\n@media (max-width: 1280px) {\n\t.dsp-rail { width: 196px; }\n\t.dsp-chat { width: 324px; }\n}\n\n@media (max-width: 1040px) {\n\t.dsp-rail { width: 168px; }\n\t.dsp-chat { width: 300px; }\n\t.dsp-page-head { padding: 18px 16px 10px; }\n\t.dsp-page-body { padding: 4px 16px 26px; }\n}\n\n@media (max-width: 880px) {\n\t.dsp-rail { display: none; }\n}\n/* ==== src/client/css/chat.css ==== */\n/* 刷题模式 — 右侧对话区 / 框选提问（chat-ui-dev 维护）。\n * 类名前缀 dsp-chat-*；颜色只使用 --dsw-alias-* 主题 token，markdown 复用 base.css 的 dsp-md。\n */\n\n/* ---------------------------------------------------------------- */\n/* 对话面板骨架：独立卡片（描边 + 圆角 + 层背景 + 轻阴影 + 外边距）      */\n/* 宽度由 ChatPanel 内联 style 控制；高度由 .dsp-app 的 flex stretch 撑满 */\n/* ---------------------------------------------------------------- */\n\n.dsp-chat {\n\tposition: relative;\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n\toverflow: hidden;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 14px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tbox-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.035);\n\tmargin: 12px 12px 12px 6px;\n}\n\n/* 左边缘拖拽手柄：6px 热区 + 2px 高亮线（上下内缩，避开卡片圆角），hover/拖动时显示。 */\n.dsp-chat-resize-handle {\n\tposition: absolute;\n\ttop: 0;\n\tbottom: 0;\n\tleft: 0;\n\twidth: 6px;\n\tz-index: 6;\n\tcursor: col-resize;\n\ttouch-action: none;\n\tbackground: transparent;\n}\n\n.dsp-chat-resize-handle::after {\n\tcontent: '';\n\tposition: absolute;\n\ttop: 14px;\n\tbottom: 14px;\n\tleft: 1px;\n\twidth: 2px;\n\tborder-radius: 2px;\n\tbackground: transparent;\n\ttransition: background 0.12s ease;\n}\n\n.dsp-chat-resize-handle:hover::after,\n.dsp-chat-resize-active::after {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);\n}\n\n.dsp-chat-resizing {\n\tuser-select: none;\n\tcursor: col-resize;\n}\n\n/* 收起态：约 44px 窄竖条，与展开态同一卡片外观；padding 为 0 让展开按钮铺满整卡。 */\n.dsp-chat-collapsed {\n\talign-items: stretch;\n\tpadding: 0;\n\tgap: 0;\n\toverflow: hidden;\n\tmargin: 12px 10px;\n}\n\n.dsp-chat-expand {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 10px;\n\twidth: 100%;\n\theight: 100%;\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\tpadding: 0;\n\tborder: 0;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-secondary);\n\tcursor: pointer;\n}\n\n.dsp-chat-expand:hover {\n\tcolor: var(--dsw-alias-brand-primary);\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-chat-expand:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: -2px;\n}\n\n.dsp-chat-collapsed-title {\n\twriting-mode: vertical-rl;\n\ttext-orientation: mixed;\n\tletter-spacing: 0.22em;\n\tfont-size: 12px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tuser-select: none;\n}\n\n/* ---------------------------------------------------------------- */\n/* 头部                                                              */\n/* ---------------------------------------------------------------- */\n\n.dsp-chat-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tpadding: 14px 14px 6px;\n\tflex: none;\n\tmin-width: 0;\n}\n\n.dsp-chat-head-main {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 1px;\n\tmin-width: 0;\n}\n\n.dsp-chat-title-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tmin-width: 0;\n}\n\n.dsp-chat-title-icon {\n\tcolor: var(--dsw-alias-brand-primary);\n\tflex: none;\n}\n\n.dsp-chat-title {\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tline-height: 20px;\n\tcolor: var(--dsw-alias-label-primary);\n\twhite-space: nowrap;\n}\n\n.dsp-chat-sub {\n\tmax-width: 210px;\n\tfont-size: 11.5px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n\twhite-space: nowrap;\n}\n\n.dsp-chat-head-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 2px;\n\tflex: none;\n}\n\n/* ---------------------------------------------------------------- */\n/* 上下文 chips                                                      */\n/* ---------------------------------------------------------------- */\n\n.dsp-chat-context {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\tpadding: 8px 12px 0;\n\tflex: none;\n}\n\n.dsp-chat-chip {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tmin-width: 0;\n\tpadding: 4px 5px 4px 8px;\n\tborder-radius: 8px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 11.5px;\n\tline-height: 17px;\n}\n\n.dsp-chat-chip .dsp-icon {\n\tflex: none;\n}\n\n.dsp-chat-chip-question {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-1));\n}\n\n.dsp-chat-chip-selection {\n\tborder-color: var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n}\n\n.dsp-chat-chip-label {\n\tflex: none;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-weight: 500;\n\twhite-space: nowrap;\n}\n\n.dsp-chat-chip-text {\n\tmin-width: 0;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n\twhite-space: nowrap;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-chat-chip-remove {\n\twidth: 18px;\n\theight: 18px;\n\tflex: none;\n\tmargin-left: auto;\n\tborder-radius: 5px;\n}\n\n/* ---------------------------------------------------------------- */\n/* 消息区                                                            */\n/* ---------------------------------------------------------------- */\n\n.dsp-chat-scroll {\n\tdisplay: flex;\n\tflex-direction: column;\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\toverflow-y: auto;\n\toverflow-x: hidden;\n\tpadding: 12px 14px 12px;\n}\n\n/* 空态/加载态的填充容器：内容不满时撑满并垂直居中，窗口矮时按内容高度滚动。 */\n.dsp-chat-fill {\n\tdisplay: flex;\n\tflex-direction: column;\n\tjustify-content: center;\n\tflex: 1 0 auto;\n\tmin-height: 0;\n}\n\n.dsp-chat-messages {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 14px;\n\tmin-width: 0;\n}\n\n.dsp-chat-msg {\n\tdisplay: flex;\n\tmin-width: 0;\n\tanimation: dsp-fade-in 0.16s ease;\n}\n\n.dsp-chat-msg-user {\n\tjustify-content: flex-end;\n}\n\n.dsp-chat-bubble-user {\n\tmax-width: 88%;\n\tpadding: 8px 11px;\n\tborder-radius: 12px 12px 3px 12px;\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-1));\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 22%, transparent);\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 13px;\n\tline-height: 20px;\n}\n\n.dsp-chat-bubble-text {\n\twhite-space: pre-wrap;\n\tword-break: break-word;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-chat-msg-context {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\tgap: 4px;\n\tmargin-bottom: 5px;\n}\n\n.dsp-chat-ctx-tag {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 3px;\n\tpadding: 1px 6px;\n\tborder-radius: 999px;\n\tfont-size: 10.5px;\n\tline-height: 15px;\n\tcolor: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);\n}\n\n.dsp-chat-quote {\n\tdisplay: -webkit-box;\n\t-webkit-line-clamp: 4;\n\t-webkit-box-orient: vertical;\n\toverflow: hidden;\n\tmargin-bottom: 6px;\n\tpadding: 4px 8px;\n\tborder-left: 2px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 42%, transparent);\n\tborder-radius: 4px;\n\tbackground: color-mix(in srgb, var(--dsw-alias-label-primary) 5%, transparent);\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\twhite-space: pre-wrap;\n\tword-break: break-word;\n}\n\n.dsp-chat-msg-assistant {\n\talign-items: flex-start;\n\tgap: 8px;\n}\n\n.dsp-chat-avatar {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: 22px;\n\theight: 22px;\n\tmargin-top: 1px;\n\tborder-radius: 7px;\n\tflex: none;\n\tcolor: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n}\n\n.dsp-chat-assistant-body {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tpadding-top: 1px;\n}\n\n.dsp-chat-md {\n\tfont-size: 13px;\n\tline-height: 21px;\n}\n\n/* 修复折叠 Markdown 后的块级层次：标题上间距 / 段落间距 / 列表行距。 */\n.dsp-chat-md .dsp-md-h {\n\tmargin: 14px 0 6px;\n\tline-height: 23px;\n}\n\n.dsp-chat-md .dsp-md-h:first-child {\n\tmargin-top: 0;\n}\n\n.dsp-chat-md .dsp-md-h + .dsp-md-p,\n.dsp-chat-md .dsp-md-h + .dsp-md-list {\n\tmargin-top: 2px;\n}\n\n.dsp-chat-md .dsp-md-p {\n\tmargin: 0 0 8px;\n}\n\n.dsp-chat-md .dsp-md-p:last-child {\n\tmargin-bottom: 0;\n}\n\n.dsp-chat-md .dsp-md-list {\n\tmargin: 4px 0 10px;\n\tpadding-left: 20px;\n}\n\n.dsp-chat-md .dsp-md-list li {\n\tmargin: 3px 0;\n\tline-height: 21px;\n}\n\n.dsp-chat-md .dsp-md-list li:first-child {\n\tmargin-top: 0;\n}\n\n.dsp-chat-md .dsp-md-list li:last-child {\n\tmargin-bottom: 0;\n}\n\n.dsp-chat-md .dsp-md-list:last-child {\n\tmargin-bottom: 0;\n}\n\n.dsp-chat-md > :last-child {\n\tmargin-bottom: 0;\n}\n\n.dsp-chat-msg-error .dsp-chat-avatar {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent);\n}\n\n.dsp-chat-msg-error .dsp-chat-md {\n\tpadding: 8px 10px;\n\tborder-radius: 10px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 28%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-chat-refs {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\tgap: 5px;\n\tmargin-top: 6px;\n}\n\n.dsp-chat-ref {\n\tmax-width: 100%;\n\tmin-width: 0;\n}\n\n/* 流式输出：光标动画用伪元素挂在最后一段内容后，避免额外节点抖动。 */\n.dsp-chat-stream-md > :last-child::after {\n\tcontent: '▍';\n\tdisplay: inline-block;\n\tmargin-left: 2px;\n\tcolor: var(--dsw-alias-brand-primary);\n\tanimation: dsp-chat-blink 1.05s steps(2, start) infinite;\n}\n\n@keyframes dsp-chat-blink {\n\t0%, 49% { opacity: 1; }\n\t50%, 100% { opacity: 0; }\n}\n\n.dsp-chat-thinking {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tpadding: 2px 0;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 12.5px;\n\tline-height: 19px;\n}\n\n.dsp-chat-loading {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 8px;\n\tpadding: 26px 12px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 12.5px;\n}\n\n.dsp-chat-banner-error {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tgap: 7px;\n\tmargin-bottom: 12px;\n\tpadding: 8px 10px;\n\tborder-radius: 9px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 28%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);\n\tcolor: var(--dsw-alias-state-error-primary);\n\tfont-size: 11.5px;\n\tline-height: 17px;\n}\n\n.dsp-chat-banner-error .dsp-icon {\n\tflex: none;\n\tmargin-top: 1px;\n}\n\n.dsp-chat-banner-text {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tword-break: break-word;\n}\n\n/* ---------------------------------------------------------------- */\n/* 空态与建议问题                                                    */\n/* ---------------------------------------------------------------- */\n\n.dsp-chat-empty {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 6px;\n\twidth: 100%;\n\tmin-width: 0;\n\tpadding: 20px 10px;\n\ttext-align: center;\n}\n\n.dsp-chat-empty-center {\n\tgap: 8px;\n\tpadding: 26px 12px;\n}\n\n.dsp-chat-empty-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: 38px;\n\theight: 38px;\n\tmargin-bottom: 2px;\n\tborder-radius: 11px;\n\tcolor: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 9%, transparent);\n}\n\n.dsp-chat-empty-title {\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tline-height: 21px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-chat-suggestions {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\twidth: 100%;\n\tmax-width: 320px;\n\tmargin: 10px auto 0;\n\talign-self: center;\n}\n\n.dsp-chat-suggest {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 7px;\n\twidth: 100%;\n\tmin-width: 0;\n\tpadding: 8px 10px;\n\tborder-radius: 9px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\ttext-align: left;\n\tcursor: pointer;\n\ttransition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;\n}\n\n.dsp-chat-suggest .dsp-icon {\n\tflex: none;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-chat-suggest:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 34%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-1));\n}\n\n.dsp-chat-suggest:focus-visible,\n.dsp-selection-action-btn:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n/* ---------------------------------------------------------------- */\n/* 输入区                                                            */\n/* ---------------------------------------------------------------- */\n\n/* 输入区：消息区下方一条 0.5px 分割线，线下为通栏输入区（无块包裹/无圆角/无底色）。 */\n.dsp-chat-composer {\n\tdisplay: flex;\n\talign-items: flex-end;\n\tgap: 8px;\n\tflex: none;\n\tpadding: 10px 14px 12px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: transparent;\n}\n\n.dsp-chat-input {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tmin-height: 30px;\n\tmax-height: 132px;\n\tpadding: 5px 0;\n\tborder: 0;\n\tborder-radius: 0;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 13px;\n\tline-height: 20px;\n\toutline: none;\n\tresize: none;\n\toverflow-y: auto;\n}\n\n.dsp-chat-input::placeholder {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-chat-input:disabled {\n\topacity: 0.72;\n\tcursor: default;\n}\n\n.dsp-chat .dsp-chat-send.dsp-btn {\n\twidth: 32px;\n\theight: 32px;\n\tmin-width: 32px;\n\tpadding: 0;\n\tflex: none;\n\tborder-radius: 9px;\n}\n\n.dsp-chat-confirm-text {\n\tfont-size: 12.5px;\n\tline-height: 20px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n/* ---------------------------------------------------------------- */\n/* 框选提问浮层（容器样式在 base.css，这里补按钮内部）                */\n/* ---------------------------------------------------------------- */\n\n.dsp-selection-action-btn {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 4px;\n\tpadding: 0 2px;\n\tborder: 0;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-size: 12px;\n\tline-height: 18px;\n\tfont-weight: 500;\n\tcursor: pointer;\n\twhite-space: nowrap;\n}\n\n.dsp-selection-action-btn:hover {\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-selection-action-btn .dsp-icon {\n\tflex: none;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n/* ---------------------------------------------------------------- */\n/* 窄屏适配：宽度由 ChatPanel 内联 style（拖拽/收起/localStorage）决定，   */\n/* 这里只压缩头部/消息区的内边距，避免挤占正文。                        */\n/* ---------------------------------------------------------------- */\n\n@media (max-width: 1200px) {\n\t.dsp-chat-head {\n\t\tpadding: 12px 12px 4px;\n\t}\n\n\t.dsp-chat-sub {\n\t\tmax-width: 176px;\n\t}\n\n\t.dsp-chat-scroll {\n\t\tpadding: 10px 12px 10px;\n\t}\n\n\t.dsp-chat-composer {\n\t\tpadding: 8px 12px 10px;\n\t}\n}\n\n@media (max-width: 1040px) {\n\t.dsp-chat-head-actions {\n\t\tgap: 0;\n\t}\n\n\t.dsp-chat-bubble-user {\n\t\tmax-width: 92%;\n\t}\n}\n\n@media (prefers-reduced-motion: reduce) {\n\t.dsp-chat-stream-md > :last-child::after {\n\t\tanimation: none;\n\t}\n}\n/* ==== src/client/css/dash.css ==== */\n/* 刷题模式 — 课程看板 / 全局看板样式（course-ui-dev）。\n * 统计卡、题型条形图、7 天趋势 SVG、易错题、课程对比、最近活动、分析 markdown。\n * 颜色只使用 --dsw-alias-* 主题 token。\n */\n\n.dsp-dash-head {\n\tflex-wrap: wrap;\n}\n\n.dsp-dash-head-main {\n\tflex: 1 1 260px;\n\tmin-width: 0;\n}\n\n.dsp-dash-title-row {\n\talign-items: center;\n\tmin-width: 0;\n}\n\n.dsp-dash-head-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 8px;\n\tflex-wrap: wrap;\n\tflex: none;\n}\n\n.dsp-dash-body {\n\tgap: 16px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 统计卡                                                              */\n/* ------------------------------------------------------------------ */\n\n.dsp-stats {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(4, minmax(0, 1fr));\n\tgap: 12px;\n}\n\n.dsp-stat-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 3px;\n\tmin-width: 0;\n\tpadding: 12px 14px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 10px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-stat-top {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tmin-width: 0;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-stat-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tflex: none;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-stat-label {\n\tfont-size: 12px;\n\tline-height: 17px;\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-stat-value {\n\tfont-size: 22px;\n\tline-height: 30px;\n\tfont-weight: 650;\n\tletter-spacing: -0.01em;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-variant-numeric: tabular-nums;\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-stat-hint {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-stat-card-brand .dsp-stat-icon,\n.dsp-stat-card-success .dsp-stat-icon,\n.dsp-stat-card-warn .dsp-stat-icon {\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-stat-card-success .dsp-stat-icon {\n\tcolor: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-stat-card-warn .dsp-stat-icon {\n\tcolor: var(--dsw-alias-state-warn-primary);\n}\n\n/* ------------------------------------------------------------------ */\n/* 看板栅格                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-dash-grid {\n\tdisplay: grid;\n\tgrid-template-columns: minmax(0, 1fr) minmax(0, 1fr);\n\tgap: 16px;\n\talign-items: stretch;\n}\n\n.dsp-dash-bottom {\n\tdisplay: grid;\n\tgrid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);\n\tgap: 16px;\n\talign-items: start;\n}\n\n.dsp-global-grid {\n\talign-items: start;\n}\n\n/* ------------------------------------------------------------------ */\n/* 统一入口页：所有课程看板（左栏已移除，内容居中并增加左右留白）        */\n/* ------------------------------------------------------------------ */\n\n.dsp-global-page .dsp-page-head {\n\twidth: 100%;\n\tmax-width: 1280px;\n\tmargin-left: auto;\n\tmargin-right: auto;\n\tpadding: 26px 32px 16px;\n\tflex-wrap: wrap;\n}\n\n.dsp-global-page .dsp-page-body {\n\twidth: 100%;\n\tmax-width: 1280px;\n\tmargin-left: auto;\n\tmargin-right: auto;\n\tpadding: 4px 32px 40px;\n\tgap: 20px;\n}\n\n/* 课程区块（卡片网格） */\n.dsp-global-courses {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n}\n\n.dsp-global-courses .dsp-section-head {\n\tmargin-bottom: 12px;\n}\n\n.dsp-global-courses-empty .dsp-empty {\n\tpadding: 44px 20px;\n}\n\n.dsp-course-grid {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(3, minmax(0, 1fr));\n\tgap: 14px;\n}\n\n.dsp-course-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 7px;\n\tmin-width: 0;\n\tpadding: 14px 16px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 12px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcursor: pointer;\n\ttransition: border-color 0.12s ease, background 0.12s ease;\n}\n\n.dsp-course-card:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 42%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, var(--dsw-alias-bg-layer-1));\n}\n\n.dsp-course-card:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-course-card-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 7px;\n\tmin-width: 0;\n}\n\n.dsp-course-card-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tflex: none;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-course-card-name {\n\tfont-size: 14px;\n\tline-height: 20px;\n\tfont-weight: 600;\n\tmin-width: 0;\n}\n\n.dsp-course-card-desc {\n\tmargin: 0;\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tdisplay: -webkit-box;\n\t-webkit-line-clamp: 2;\n\t-webkit-box-orient: vertical;\n\toverflow: hidden;\n\tmin-height: 36px;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-course-card-meta {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 4px 10px;\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-course-card-time {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-course-card-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 8px;\n\tmargin-top: auto;\n\tpadding-top: 4px;\n}\n\n.dsp-dash-type-card .dsp-empty,\n.dsp-trend-card .dsp-empty,\n.dsp-wrong-card .dsp-empty,\n.dsp-analysis-card .dsp-empty,\n.dsp-compare-card .dsp-empty,\n.dsp-activity-card .dsp-empty,\n.dsp-dash-heat-card .dsp-empty {\n\tpadding: 26px 16px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 题型条形图                                                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-bars {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 11px;\n}\n\n.dsp-bar-row {\n\tdisplay: grid;\n\tgrid-template-columns: 70px minmax(0, 1fr) 44px;\n\talign-items: center;\n\tgap: 10px;\n\tmin-width: 0;\n}\n\n.dsp-bar-label {\n\tdisplay: inline-flex;\n\talign-items: baseline;\n\tgap: 5px;\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n}\n\n.dsp-bar-label-count {\n\tfont-size: 10.5px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-bar-track {\n\tdisplay: block;\n\theight: 8px;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\toverflow: hidden;\n\tmin-width: 0;\n}\n\n.dsp-bar-fill {\n\tdisplay: block;\n\theight: 100%;\n\tborder-radius: inherit;\n\tbackground: var(--dsw-alias-brand-primary);\n\ttransition: width 0.3s ease;\n}\n\n.dsp-bar-fill-good {\n\tbackground: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-bar-fill-bad {\n\tbackground: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-bar-value {\n\tfont-size: 12px;\n\tline-height: 18px;\n\ttext-align: right;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-variant-numeric: tabular-nums;\n\twhite-space: nowrap;\n}\n\n.dsp-skeleton {\n\tdisplay: inline-block;\n\tborder-radius: 6px;\n\tbackground: color-mix(in srgb, var(--dsw-alias-label-primary) 10%, var(--dsw-alias-bg-layer-1));\n\tanimation: dsp-dash-shimmer 1.15s ease-in-out infinite;\n}\n\n.dsp-skeleton-label {\n\twidth: 52px;\n\theight: 12px;\n}\n\n.dsp-skeleton-fill {\n\tdisplay: block;\n\theight: 8px;\n\tborder-radius: 999px;\n}\n\n.dsp-skeleton-value {\n\twidth: 38px;\n\theight: 12px;\n\tjustify-self: end;\n}\n\n@keyframes dsp-dash-shimmer {\n\t0% { opacity: 0.5; }\n\t50% { opacity: 1; }\n\t100% { opacity: 0.5; }\n}\n\n/* ------------------------------------------------------------------ */\n/* 7 天趋势 SVG                                                        */\n/* ------------------------------------------------------------------ */\n\n.dsp-trend-svg {\n\tdisplay: block;\n\twidth: 100%;\n\theight: auto;\n\toverflow: visible;\n}\n\n.dsp-trend-grid {\n\tstroke: var(--dsw-alias-border-l1);\n\tstroke-width: 1;\n\tstroke-dasharray: 3 5;\n}\n\n.dsp-trend-axis {\n\tstroke: var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tstroke-width: 1;\n}\n\n.dsp-trend-bar {\n\tfill: color-mix(in srgb, var(--dsw-alias-brand-primary) 46%, transparent);\n\ttransition: fill 0.12s ease;\n}\n\n.dsp-trend-bar-today {\n\tfill: var(--dsw-alias-brand-primary);\n}\n\n.dsp-trend-bar-empty {\n\tfill: color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent);\n}\n\n.dsp-trend-value {\n\tfill: var(--dsw-alias-label-secondary);\n\tfont-size: 11px;\n\tfont-weight: 500;\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-trend-label {\n\tfill: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-size: 10.5px;\n}\n\n.dsp-trend-label-today {\n\tfill: var(--dsw-alias-label-primary);\n\tfont-weight: 600;\n}\n\n/* ------------------------------------------------------------------ */\n/* 易错题                                                              */\n/* ------------------------------------------------------------------ */\n\n.dsp-wrong-list {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n}\n\n.dsp-wrong-item {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 3px;\n\twidth: 100%;\n\tmin-width: 0;\n\tpadding: 8px 10px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-base);\n\tcolor: var(--dsw-alias-label-primary);\n\ttext-align: left;\n\tcursor: pointer;\n}\n\n.dsp-wrong-item:hover {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-wrong-item:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-wrong-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 4px;\n\tmin-width: 0;\n\tfont-size: 11.5px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tflex-wrap: wrap;\n}\n\n.dsp-wrong-set {\n\tfont-weight: 600;\n\tcolor: var(--dsw-alias-label-secondary);\n\tmin-width: 0;\n\tmax-width: 60%;\n}\n\n.dsp-wrong-index {\n\twhite-space: nowrap;\n}\n\n.dsp-wrong-count {\n\twhite-space: nowrap;\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-wrong-stem {\n\tdisplay: -webkit-box;\n\t-webkit-line-clamp: 2;\n\t-webkit-box-orient: vertical;\n\toverflow: hidden;\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-primary);\n\toverflow-wrap: anywhere;\n}\n\n.dsp-wrong-meta {\n\tfont-size: 10.5px;\n\tline-height: 15px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-variant-numeric: tabular-nums;\n}\n\n/* ------------------------------------------------------------------ */\n/* AI 学情分析与复习方案                                               */\n/* ------------------------------------------------------------------ */\n\n.dsp-analysis-head-actions {\n\tflex-wrap: wrap;\n}\n\n.dsp-analysis-md {\n\tmax-height: 560px;\n\toverflow-y: auto;\n\tpadding-right: 2px;\n}\n\n.dsp-dash-analysis-progress {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 9px;\n\tpadding: 6px 2px 10px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 课程对比                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-compare-list {\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.dsp-compare-row {\n\tdisplay: grid;\n\tgrid-template-columns: minmax(0, 1fr) minmax(64px, 34%) 46px;\n\talign-items: center;\n\tgap: 12px;\n\twidth: 100%;\n\tmin-width: 0;\n\tpadding: 9px 4px;\n\tborder: 0;\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 6px;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-primary);\n\ttext-align: left;\n\tcursor: pointer;\n}\n\n.dsp-compare-row:last-child {\n\tborder-bottom: 0;\n}\n\n.dsp-compare-row:hover {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-compare-row:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-compare-name {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 1px;\n\tmin-width: 0;\n}\n\n.dsp-compare-title {\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\tfont-weight: 600;\n\tmin-width: 0;\n}\n\n.dsp-compare-meta {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-compare-track {\n\tdisplay: block;\n\theight: 8px;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\toverflow: hidden;\n\tmin-width: 0;\n}\n\n.dsp-compare-fill {\n\tdisplay: block;\n\theight: 100%;\n\tborder-radius: inherit;\n\tbackground: var(--dsw-alias-brand-primary);\n\ttransition: width 0.3s ease;\n}\n\n.dsp-compare-fill-bad {\n\tbackground: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-compare-value {\n\tfont-size: 12px;\n\tline-height: 18px;\n\ttext-align: right;\n\tfont-variant-numeric: tabular-nums;\n\twhite-space: nowrap;\n}\n\n/* ------------------------------------------------------------------ */\n/* 最近活动                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-activity-list {\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.dsp-activity-row {\n\tdisplay: grid;\n\tgrid-template-columns: 8px minmax(0, 1fr) auto auto;\n\talign-items: center;\n\tgap: 9px;\n\tpadding: 7px 2px;\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n\tmin-width: 0;\n}\n\n.dsp-activity-row:last-child {\n\tborder-bottom: 0;\n}\n\n.dsp-activity-dot {\n\tdisplay: block;\n\twidth: 7px;\n\theight: 7px;\n\tborder-radius: 50%;\n\tbackground: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-activity-dot-success {\n\tbackground: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-activity-dot-error {\n\tbackground: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-activity-main {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tmin-width: 0;\n\tfont-size: 12px;\n\tline-height: 18px;\n}\n\n.dsp-activity-course {\n\tfont-weight: 600;\n\tmin-width: 0;\n\tmax-width: 45%;\n}\n\n.dsp-activity-sep {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-activity-set {\n\tcolor: var(--dsw-alias-label-secondary);\n\tmin-width: 0;\n}\n\n.dsp-activity-time {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\twhite-space: nowrap;\n\tfont-variant-numeric: tabular-nums;\n}\n\n\n/* ------------------------------------------------------------------ */\n/* 活跃度热力图                                                        */\n/* ------------------------------------------------------------------ */\n\n.dsp-dash-heat-wrap {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-dash-heat-grid {\n\tdisplay: grid;\n\tgrid-auto-flow: column;\n\tgrid-template-rows: repeat(7, 12px);\n\tgrid-auto-columns: 12px;\n\tgap: 3px;\n\tjustify-content: flex-start;\n\toverflow-x: auto;\n\tpadding: 2px 0;\n}\n\n.dsp-dash-heat-cell,\n.dsp-dash-heat-swatch {\n\tdisplay: block;\n\twidth: 12px;\n\theight: 12px;\n\tborder-radius: 3px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tflex: none;\n}\n\n.dsp-dash-heat-cell-l1 {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 20%, transparent);\n}\n\n.dsp-dash-heat-cell-l2 {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent);\n}\n\n.dsp-dash-heat-cell-l3 {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 65%, transparent);\n}\n\n.dsp-dash-heat-cell-l4 {\n\tbackground: var(--dsw-alias-brand-primary);\n}\n\n.dsp-dash-heat-cell-future {\n\tbackground: transparent;\n}\n\n.dsp-dash-heat-cell:not(.dsp-dash-heat-cell-future):hover {\n\toutline: 1px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\toutline-offset: 1px;\n}\n\n.dsp-dash-heat-legend {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 4px;\n}\n\n.dsp-dash-heat-legend-label {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n/* ------------------------------------------------------------------ */\n/* 响应式：主区在 900–1600px 视口下稳定，窄于 1100px 统计卡换行         */\n/* ------------------------------------------------------------------ */\n\n@media (max-width: 1320px) {\n\t.dsp-course-grid {\n\t\tgrid-template-columns: repeat(2, minmax(0, 1fr));\n\t}\n}\n\n@media (max-width: 1260px) {\n\t.dsp-dash-grid,\n\t.dsp-dash-bottom {\n\t\tgrid-template-columns: minmax(0, 1fr);\n\t}\n}\n\n@media (max-width: 1100px) {\n\t.dsp-stats {\n\t\tgrid-template-columns: repeat(2, minmax(0, 1fr));\n\t}\n\n\t.dsp-dash-head-actions {\n\t\tjustify-content: flex-start;\n\t\twidth: 100%;\n\t}\n\n\t.dsp-global-page .dsp-page-head {\n\t\tpadding: 22px 22px 14px;\n\t}\n\n\t.dsp-global-page .dsp-page-body {\n\t\tpadding: 4px 22px 36px;\n\t}\n}\n\n@media (max-width: 980px) {\n\t.dsp-course-grid {\n\t\tgrid-template-columns: minmax(0, 1fr);\n\t}\n}\n\n@media (max-width: 720px) {\n\t.dsp-stats {\n\t\tgrid-template-columns: minmax(0, 1fr);\n\t}\n\n\t.dsp-compare-row {\n\t\tgrid-template-columns: minmax(0, 1fr) 48px;\n\t}\n\n\t.dsp-compare-track {\n\t\tdisplay: none;\n\t}\n}\n/* ==== src/client/css/practice.css ==== */\n/* 刷题模式 — 刷题区（中间核心区）样式，practice-ui-dev 维护。\n * 类名前缀统一 dsp-；颜色只使用 --dsw-alias-* 主题 token（与 base.css 保持一致），\n * 尺寸 / 圆角 / 阴影优先使用宿主 --dsw-* token 并给 fallback。\n *\n * 结构索引：\n *   .dsp-practice-*   根布局、顶部条、题号导航、底部按钮、空态/错误/解析进度、能力提示\n *   .dsp-mode-*       模式选择卡\n *   .dsp-question-*   题目卡 / 共用材料 / 题图\n *   .dsp-answer-*     选项与作答控件\n *   .dsp-fill / .dsp-reveal*  填空输入、解析区（答案 / 解析 / 自评 / 一键提问）\n *   .dsp-result-* / .dsp-type-* / .dsp-pending-* / .dsp-analysis-*  交卷结果页\n */\n\n/* ------------------------------------------------------------------ */\n/* 布局                                                                */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice {\n\tdisplay: flex;\n\tflex-direction: column;\n\tflex: 1 1 auto;\n\twidth: 100%;\n\theight: 100%;\n\tmin-height: 0;\n\tmin-width: 0;\n\toverflow: hidden;\n\t/* 题目字号缩放系数，由顶部条 A− / A+ 写入 inline style */\n\t--dsp-question-font-scale: 1;\n}\n\n.dsp-practice-panel {\n\tdisplay: flex;\n\tflex-direction: column;\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\tmin-width: 0;\n}\n\n.dsp-practice-scroll {\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\toverflow-y: auto;\n\toverflow-x: hidden;\n\toverscroll-behavior: contain;\n}\n\n.dsp-practice-inner {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 14px;\n\twidth: 100%;\n\tmax-width: 980px;\n\tmargin: 0 auto;\n\tpadding: 18px 24px 40px;\n\tmin-width: 0;\n}\n\n.dsp-practice-center {\n\tdisplay: flex;\n\tjustify-content: center;\n\tpadding: 56px 0 24px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 题目字号缩放（顶部条写入 --dsp-question-font-scale：80%~150%）       */\n/* 只作用于题目卡正文（题干/选项/材料/解析/答案），不影响导航/按钮。   */\n/* ------------------------------------------------------------------ */\n\n.dsp-question .dsp-question-stem {\n\tfont-size: calc(14px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(23px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question-material .dsp-md {\n\tfont-size: calc(13px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(20px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-answer-text,\n.dsp-question .dsp-reveal-user,\n.dsp-question .dsp-reveal-user-text {\n\tfont-size: calc(13px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(20px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-reveal-user {\n\tfont-size: calc(12px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-reveal-answer {\n\tfont-size: calc(14px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(22px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-reveal-answer-block {\n\tfont-size: calc(13.5px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(21px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-reveal-analysis-body,\n.dsp-question .dsp-reveal-option-line,\n.dsp-question .dsp-reveal-source-answer-text,\n.dsp-question .dsp-ai-grade-summary,\n.dsp-question .dsp-ai-grade-corrected,\n.dsp-question .dsp-ai-grade-list {\n\tfont-size: calc(12.5px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(20px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-input,\n.dsp-question .dsp-textarea {\n\tfont-size: calc(13px * var(--dsp-question-font-scale, 1));\n\tline-height: calc(20px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-h1 {\n\tfont-size: calc(18px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-h2 {\n\tfont-size: calc(16px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-h3 {\n\tfont-size: calc(14.5px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-h4,\n.dsp-question .dsp-md-h5,\n.dsp-question .dsp-md-h6 {\n\tfont-size: calc(13.5px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-code,\n.dsp-question .dsp-md-block-code {\n\tfont-size: calc(12px * var(--dsp-question-font-scale, 1));\n}\n\n.dsp-question .dsp-md-table {\n\tfont-size: calc(12.5px * var(--dsp-question-font-scale, 1));\n}\n\n/* 题目内 markdown 表格：宽度自适应、可横向滚动、不撑破题目卡 */\n.dsp-question .dsp-md-table-wrap {\n\tmax-width: 100%;\n\toverflow-x: auto;\n}\n\n.dsp-question .dsp-md-table {\n\twidth: max-content;\n\tmin-width: 100%;\n\tmax-width: none;\n}\n\n.dsp-question .dsp-md-table th,\n.dsp-question .dsp-md-table td {\n\twhite-space: pre-wrap;\n\toverflow-wrap: anywhere;\n}\n\n/* ------------------------------------------------------------------ */\n/* 左右分栏：左侧固定图片面板 + 可拖动分隔条                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-split {\n\tdisplay: flex;\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tmin-height: 0;\n}\n\n.dsp-practice-split-main {\n\tdisplay: flex;\n\tflex: 1 1 auto;\n\tflex-direction: column;\n\tmin-width: 0;\n\tmin-height: 0;\n}\n\n.dsp-practice-image-pane {\n\tdisplay: flex;\n\tflex: 0 0 auto;\n\tflex-direction: column;\n\theight: 100%;\n\tmin-width: 0;\n\tmin-height: 0;\n\toverflow: hidden;\n\tborder-right: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-practice-image-pane-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tflex: none;\n\tpadding: 8px 6px 8px 12px;\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n\tmin-width: 0;\n}\n\n.dsp-practice-image-pane-title {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tfont-size: 12.5px;\n\tfont-weight: 600;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-practice-image-pane-zoom {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 2px;\n\tflex: none;\n\tpadding: 5px 8px;\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n.dsp-practice-image-pane-zoom .dsp-btn {\n\theight: 24px;\n\tpadding: 0 5px;\n\tfont-size: 11.5px;\n}\n\n.dsp-practice-image-pane-percent {\n\tflex: 1 1 40px;\n\tmin-width: 40px;\n\ttext-align: center;\n\tfont-size: 11.5px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-practice-image-pane-reset {\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-practice-image-pane-scroll {\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\toverflow: auto;\n\toverscroll-behavior: contain;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n}\n\n/* width:max-content 让放大后的图片把画布真实撑宽/撑高（配合显式像素尺寸），\n * min-width/min-height:100% 保证 100% 及缩小时内容居中且铺满可滚动区域。 */\n.dsp-practice-image-pane-canvas {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tjustify-content: center;\n\twidth: max-content;\n\tmin-width: 100%;\n\tmin-height: 100%;\n\tbox-sizing: border-box;\n\tpadding: 10px;\n}\n\n.dsp-practice-image-pane-img {\n\tdisplay: block;\n\tflex: none;\n\tmax-width: none;\n\theight: auto;\n\tborder-radius: 6px;\n\tbackground: var(--dsw-alias-bg-base);\n}\n\n.dsp-practice-image-pane-empty {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 8px;\n\twidth: 100%;\n\tmin-height: 160px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-size: 12px;\n}\n\n.dsp-practice-splitter {\n\tposition: relative;\n\tflex: none;\n\twidth: 6px;\n\tcursor: col-resize;\n\tbackground: transparent;\n\ttouch-action: none;\n}\n\n.dsp-practice-splitter::after {\n\tcontent: '';\n\tposition: absolute;\n\ttop: 0;\n\tbottom: 0;\n\tleft: 2px;\n\twidth: 2px;\n\tborder-radius: 2px;\n\tbackground: var(--dsw-alias-border-l1);\n\ttransition: background 0.12s ease;\n}\n\n.dsp-practice-splitter:hover::after,\n.dsp-practice-splitter:focus-visible::after {\n\tbackground: var(--dsw-alias-brand-primary);\n}\n\n.dsp-practice-splitter:focus-visible {\n\toutline: none;\n}\n\n/* ------------------------------------------------------------------ */\n/* 提示条（能力提示 / 解析 warnings）                                   */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-banner {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tgap: 8px;\n\tpadding: 8px 10px;\n\tborder-radius: 8px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);\n\tcolor: var(--dsw-alias-state-warn-primary);\n\tfont-size: 12px;\n\tline-height: 18px;\n\tmin-width: 0;\n}\n\n.dsp-practice-banner > .dsp-icon {\n\tflex: none;\n\tmargin-top: 1px;\n}\n\n.dsp-practice-banner-text {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tcolor: var(--dsw-alias-label-secondary);\n\toverflow-wrap: anywhere;\n}\n\n.dsp-practice-banner-info {\n\tborder-color: var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n/* ------------------------------------------------------------------ */\n/* 顶部条                                                              */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-top {\n\tflex: none;\n\tbackground: var(--dsw-alias-bg-base);\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n.dsp-practice-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px 16px;\n\tpadding: 12px 20px 10px;\n\tflex-wrap: wrap;\n}\n\n.dsp-practice-head-main {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n\tflex: 1 1 240px;\n}\n\n.dsp-practice-head-titles {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n}\n\n.dsp-practice-title {\n\tfont-size: 14.5px;\n\tfont-weight: 600;\n\tline-height: 21px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-practice-sub {\n\tfont-size: 11.5px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-practice-head-meta {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tflex-wrap: wrap;\n\tgap: 6px 12px;\n\tmin-width: 0;\n}\n\n.dsp-practice-meta {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 4px;\n\twhite-space: nowrap;\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-practice-clock {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n/* 顶部条题目字号控件（A− / 百分比 / A+ / 重置） */\n.dsp-practice-font-scale {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 2px;\n\tflex: none;\n\tpadding: 1px 2px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 7px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-practice-font-scale .dsp-btn {\n\theight: 22px;\n\tpadding: 0 5px;\n\tfont-size: 11.5px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-practice-font-scale-percent {\n\tmin-width: 40px;\n\ttext-align: center;\n\tfont-size: 11.5px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-practice-head-progress {\n\tpadding: 0 20px 8px;\n}\n\n.dsp-practice-head-progress .dsp-progress {\n\theight: 3px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 题号导航条                                                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-nav {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\tgap: 6px;\n\tpadding: 2px 0;\n}\n\n.dsp-practice-nav-item {\n\tmin-width: 30px;\n\theight: 28px;\n\tpadding: 0 7px;\n\tborder-radius: 7px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 12px;\n\tfont-weight: 500;\n\tline-height: 26px;\n\tcursor: pointer;\n\tfont-variant-numeric: tabular-nums;\n\ttransition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;\n}\n\n.dsp-practice-nav-item:hover {\n\tborder-color: var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tcolor: var(--dsw-alias-label-primary);\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-practice-nav-item-current,\n.dsp-practice-nav-item-current:hover {\n\tbackground: var(--dsw-alias-brand-primary);\n\tborder-color: var(--dsw-alias-brand-primary);\n\tcolor: var(--dsw-alias-label-primary-foreground, #ffffff);\n}\n\n.dsp-practice-nav-item-correct {\n\tcolor: var(--dsw-alias-state-success-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 36%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent);\n}\n\n.dsp-practice-nav-item-wrong {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 36%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);\n}\n\n.dsp-practice-nav-item-pending {\n\tcolor: var(--dsw-alias-state-warn-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 36%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);\n}\n\n.dsp-practice-nav-item-answered {\n\tcolor: var(--dsw-alias-brand-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 32%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, transparent);\n}\n\n.dsp-practice-nav-item:focus-visible,\n.dsp-mode-card:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 底部操作条                                                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-foot {\n\tflex: none;\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tpadding: 10px 20px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tflex-wrap: wrap;\n}\n\n.dsp-practice-foot-left,\n.dsp-practice-foot-right {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n/* ------------------------------------------------------------------ */\n/* 解析进度卡                                                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-parse-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\ttext-align: center;\n\tgap: 12px;\n\twidth: min(520px, 100%);\n\tpadding: 30px 26px;\n}\n\n.dsp-parse-icon {\n\tdisplay: inline-flex;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-parse-icon-error {\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-parse-title {\n\tfont-size: 15px;\n\tfont-weight: 600;\n\tline-height: 22px;\n}\n\n.dsp-parse-message {\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\tmax-width: 420px;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-parse-progress {\n\twidth: 100%;\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n}\n\n.dsp-parse-progress-meta {\n\ttext-align: right;\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-parse-error {\n\tmax-width: 440px;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-state-error-primary);\n\toverflow-wrap: anywhere;\n}\n\n.dsp-parse-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 8px;\n\tflex-wrap: wrap;\n\tmargin-top: 2px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 加载失败 / 空态                                                     */\n/* ------------------------------------------------------------------ */\n\n.dsp-practice-notice {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tgap: 10px;\n\ttext-align: center;\n\twidth: min(560px, 100%);\n\tpadding: 26px 24px;\n}\n\n.dsp-practice-notice-icon {\n\tdisplay: inline-flex;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-practice-notice-icon-error {\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-practice-notice-title {\n\tfont-size: 15px;\n\tfont-weight: 600;\n\tline-height: 22px;\n}\n\n.dsp-practice-notice-text {\n\tmax-width: 460px;\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-practice-notice-actions {\n\tjustify-content: center;\n\tflex-wrap: wrap;\n\tmargin-top: 4px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 模式选择                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-mode-select {\n\tmax-width: 760px;\n\tgap: 16px;\n}\n\n.dsp-mode-head {\n\tdisplay: flex;\n\talign-items: flex-start;\n\tgap: 10px;\n}\n\n.dsp-mode-head-text {\n\tmin-width: 0;\n}\n\n.dsp-mode-grid {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(2, minmax(0, 1fr));\n\tgap: 12px;\n}\n\n.dsp-mode-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: stretch;\n\tgap: 9px;\n\tpadding: 16px;\n\tborder-radius: 11px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-primary);\n\tfont: inherit;\n\ttext-align: left;\n\tcursor: pointer;\n\ttransition: border-color 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;\n}\n\n.dsp-mode-card:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent);\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-mode-card-active,\n.dsp-mode-card-active:hover {\n\tborder-color: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-1));\n\tbox-shadow: inset 0 0 0 0.5px color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);\n}\n\n.dsp-mode-card-top {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 8px;\n}\n\n.dsp-mode-card-icon {\n\tdisplay: inline-flex;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-mode-card-check {\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-mode-card-title {\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tline-height: 21px;\n}\n\n.dsp-mode-card-desc {\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-mode-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tpadding-top: 2px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 题目卡                                                              */\n/* ------------------------------------------------------------------ */\n\n.dsp-question {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 12px;\n\tpadding: 16px 18px;\n\tmin-width: 0;\n}\n\n.dsp-question-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tflex-wrap: wrap;\n}\n\n.dsp-question-head-main {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tflex-wrap: wrap;\n\tmin-width: 0;\n}\n\n.dsp-question-number {\n\tmargin-right: 2px;\n\tfont-size: 13.5px;\n\tfont-weight: 600;\n\tline-height: 21px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-question-head-status {\n\tflex: none;\n}\n\n.dsp-question-stem {\n\tfont-size: 14px;\n\tline-height: 23px;\n}\n\n.dsp-question-stem .dsp-md-p {\n\tmargin-bottom: 7px;\n}\n\n.dsp-question-stem .dsp-md-p:last-child {\n\tmargin-bottom: 0;\n}\n\n/* 富文本保真：题干 / 共用材料 / 解析保留连续空格、缩进与换行（DSP.markdown 输出）。 */\n.dsp-md-preserve .dsp-md-p,\n.dsp-md-preserve .dsp-md-list li,\n.dsp-md-preserve .dsp-md-table td,\n.dsp-md-preserve .dsp-md-h {\n\twhite-space: pre-wrap;\n}\n\n/* 题目内代码块：不撑破卡片，横向滚动（同时覆盖选项/答案/解析等块级 markdown）。 */\n.dsp-md-preserve .dsp-md-pre,\n.dsp-question .dsp-md-pre {\n\tmax-width: 100%;\n\toverflow-x: auto;\n\toverflow-y: hidden;\n\twhite-space: pre;\n\t-webkit-overflow-scrolling: touch;\n}\n\n.dsp-md-preserve .dsp-md-block-code,\n.dsp-question .dsp-md-block-code {\n\tdisplay: block;\n\twhite-space: pre;\n}\n\n/* 行内 markdown 链接（选项/答案/用户作答等非 .dsp-md 容器内） */\n.dsp-answer-text a,\n.dsp-reveal-answer a,\n.dsp-reveal-user-text a,\n.dsp-reveal-option-line a,\n.dsp-reveal-source-answer a {\n\tcolor: var(--dsw-alias-brand-primary);\n\ttext-decoration: none;\n}\n\n.dsp-answer-text a:hover,\n.dsp-reveal-answer a:hover,\n.dsp-reveal-user-text a:hover,\n.dsp-reveal-option-line a:hover,\n.dsp-reveal-source-answer a:hover {\n\ttext-decoration: underline;\n}\n\n/* 共用材料：直接显示（无卡片式包裹），保留一行小标题与内容 */\n.dsp-question-material {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\tmin-width: 0;\n}\n\n.dsp-question-material-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tfont-size: 12px;\n\tfont-weight: 600;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-question-material-head .dsp-icon {\n\tflex: none;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-question-material-title {\n\tmin-width: 0;\n}\n\n.dsp-question-material-body {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 10px;\n\tmin-width: 0;\n}\n\n/* 题图 */\n.dsp-question-figures {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tgap: 12px;\n\tmin-width: 0;\n}\n\n.dsp-question-material-figures {\n\talign-items: flex-start;\n}\n\n.dsp-figure {\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tgap: 6px;\n\tmax-width: 100%;\n\tmin-width: 0;\n\tmargin: 0;\n}\n\n.dsp-figure-img {\n\tmax-width: 100%;\n\tmax-height: 420px;\n\tborder-radius: 8px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-figure-placeholder {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tpadding: 22px 26px;\n\tborder: 0.5px dashed var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tfont-size: 12px;\n}\n\n.dsp-figure-cap {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmax-width: 100%;\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-figure-alt {\n\tmax-width: 320px;\n}\n\n.dsp-figure-redraw {\n\theight: 24px;\n\tpadding: 0 6px;\n\tfont-size: 11.5px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n/* 点击题图固定到左侧图片面板（原图始终照常显示，固定面板只是额外并排） */\n.dsp-figure-img-pinnable {\n\tcursor: zoom-in;\n}\n\n.dsp-figure-img-pinnable:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);\n\tbox-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);\n}\n\n.dsp-figure-img-pinnable:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 2px;\n}\n\n/* ------------------------------------------------------------------ */\n/* 作答控件                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-answer-list {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-answer-option {\n\tposition: relative;\n\tdisplay: flex;\n\talign-items: flex-start;\n\tgap: 9px;\n\tpadding: 9px 12px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 9px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-primary);\n\tcursor: pointer;\n\tmin-width: 0;\n\ttransition: border-color 0.12s ease, background 0.12s ease;\n}\n\n.dsp-answer-option:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 40%, transparent);\n}\n\n.dsp-answer-option input {\n\tposition: absolute;\n\twidth: 1px;\n\theight: 1px;\n\topacity: 0;\n\tpointer-events: none;\n}\n\n.dsp-answer-option:focus-within {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-answer-indicator {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tflex: none;\n\twidth: 16px;\n\theight: 16px;\n\tmargin-top: 2px;\n\tborder-radius: 50%;\n\tborder: 1.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-answer-multiple .dsp-answer-indicator {\n\tborder-radius: 5px;\n}\n\n.dsp-answer-dot {\n\twidth: 6px;\n\theight: 6px;\n\tborder-radius: inherit;\n\tbackground: transparent;\n}\n\n.dsp-answer-key {\n\tflex: none;\n\tmin-width: 16px;\n\ttext-align: center;\n\tfont-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n\tfont-size: 12px;\n\tfont-weight: 600;\n\tline-height: 20px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-answer-text {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tfont-size: 13px;\n\tline-height: 20px;\n\toverflow-wrap: anywhere;\n\twhite-space: pre-wrap;\n\tword-break: break-word;\n}\n\n/* 选项里出现 fenced code block 时走块级渲染：不挤压选项布局，代码块内部横向滚动。 */\n.dsp-answer-text-block {\n\tdisplay: flex;\n\tflex: 1 1 auto;\n\tflex-direction: column;\n\tgap: 2px;\n\tmin-width: 0;\n\tmax-width: 100%;\n}\n\n.dsp-answer-mark {\n\tflex: none;\n\tmargin-top: 2px;\n}\n\n.dsp-answer-mark-correct {\n\tcolor: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-answer-mark-wrong {\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-answer-option-selected {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);\n}\n\n.dsp-answer-option-selected .dsp-answer-indicator {\n\tborder-color: var(--dsw-alias-brand-primary);\n\tbackground: var(--dsw-alias-brand-primary);\n}\n\n.dsp-answer-option-selected .dsp-answer-dot {\n\tbackground: var(--dsw-alias-label-primary-foreground, #ffffff);\n}\n\n.dsp-answer-option-correct,\n.dsp-answer-option-correct:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 55%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent);\n}\n\n.dsp-answer-option-correct .dsp-answer-indicator {\n\tborder-color: var(--dsw-alias-state-success-primary);\n\tbackground: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-answer-option-wrong,\n.dsp-answer-option-wrong:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);\n}\n\n.dsp-answer-option-wrong .dsp-answer-indicator {\n\tborder-color: var(--dsw-alias-state-error-primary);\n\tbackground: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-answer-option-locked {\n\tcursor: default;\n}\n\n.dsp-answer-option-locked:hover {\n\tborder-color: var(--dsw-alias-border-l1);\n}\n\n.dsp-answer-option-correct.dsp-answer-option-locked:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 55%, transparent);\n}\n\n.dsp-answer-option-wrong.dsp-answer-option-locked:hover {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 55%, transparent);\n}\n\n/* 填空 */\n.dsp-fill {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-fill-hint {\n\tmargin-bottom: 2px;\n}\n\n.dsp-fill-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-fill-label {\n\tflex: none;\n\twidth: 52px;\n}\n\n.dsp-fill-input {\n\tmax-width: 460px;\n}\n\n/* 简答 */\n.dsp-answer-textarea-wrap {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\tmin-width: 0;\n}\n\n.dsp-answer-textarea {\n\tmin-height: 96px;\n}\n\n.dsp-practice .dsp-input:disabled,\n.dsp-practice .dsp-textarea:disabled {\n\topacity: 1;\n\tcolor: var(--dsw-alias-label-primary);\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcursor: default;\n}\n\n/* ------------------------------------------------------------------ */\n/* 解析区（reveal）                                                    */\n/* ------------------------------------------------------------------ */\n\n.dsp-reveal {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 10px;\n\tmargin-top: 2px;\n\tpadding-top: 12px;\n\tborder-top: 0.5px dashed var(--dsw-alias-border-l1);\n\tanimation: dsp-fade-in 0.16s ease;\n\tmin-width: 0;\n}\n\n.dsp-reveal-head {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 8px 12px;\n\tmin-width: 0;\n}\n\n.dsp-reveal-answer-row {\n\tdisplay: inline-flex;\n\talign-items: baseline;\n\tgap: 6px;\n\tflex-wrap: wrap;\n\tmin-width: 0;\n}\n\n.dsp-reveal-label {\n\tfont-size: 12px;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-reveal-answer {\n\tfont-size: 14px;\n\tfont-weight: 600;\n\tline-height: 22px;\n\tcolor: var(--dsw-alias-brand-primary);\n\twhite-space: pre-wrap;\n\toverflow-wrap: anywhere;\n\tword-break: break-word;\n}\n\n.dsp-reveal-answer-empty {\n\tfont-weight: 500;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n/* 长参考答案/含代码块的答案：块级 markdown，独占一行，避免挤压答案行。 */\n.dsp-reveal-answer-block {\n\tflex-basis: 100%;\n\twidth: 100%;\n\tfont-size: 13.5px;\n\tline-height: 21px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n/* 参考答案来源标识（AI 参考 / AI 生成）与引用文档 */\n.dsp-reveal-source {\n\tflex: none;\n\talign-self: center;\n}\n\n.dsp-reveal-source-ai-doc {\n\tletter-spacing: 0.01em;\n}\n\n.dsp-reveal-source-note {\n\tmargin-top: -4px;\n\tline-height: 18px;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-reveal-refs {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\talign-items: baseline;\n\tgap: 2px 6px;\n\tmargin-top: -4px;\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tmin-width: 0;\n}\n\n.dsp-reveal-refs-label {\n\tflex: none;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-reveal-refs-item {\n\tfont-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n\tfont-size: 11px;\n\tline-height: 17px;\n\toverflow-wrap: anywhere;\n\tword-break: break-all;\n}\n\n.dsp-reveal-empty-hint {\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-secondary);\n\toverflow-wrap: anywhere;\n}\n\n/* 「全部 AI 重新生成」模式下展示原卷答案供核对（小字，不新增大卡片） */\n.dsp-reveal-source-answer {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\talign-items: baseline;\n\tgap: 2px 4px;\n\tmargin-top: -4px;\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tmin-width: 0;\n}\n\n.dsp-reveal-source-answer-label {\n\tflex: none;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-reveal-source-answer-text {\n\tmin-width: 0;\n\twhite-space: pre-wrap;\n\toverflow-wrap: anywhere;\n\tword-break: break-word;\n\tline-height: 19px;\n}\n\n.dsp-reveal-source-answer-text-block {\n\tflex-basis: 100%;\n\twidth: 100%;\n\tline-height: 18px;\n}\n\n.dsp-reveal-user {\n\tdisplay: flex;\n\tflex-basis: 100%;\n\tflex-wrap: wrap;\n\talign-items: baseline;\n\tgap: 0 2px;\n\tmin-width: 0;\n}\n\n.dsp-reveal-user-label {\n\tflex: none;\n}\n\n.dsp-reveal-user-text {\n\tmin-width: 0;\n\twhite-space: pre-wrap;\n\toverflow-wrap: anywhere;\n\tword-break: break-word;\n}\n\n.dsp-reveal-user-text-block {\n\tflex-basis: 100%;\n\twidth: 100%;\n}\n\n.dsp-reveal-options {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 3px;\n\tpadding: 8px 10px;\n\tborder-radius: 8px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-success-primary) 24%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-success-primary) 7%, transparent);\n}\n\n.dsp-reveal-option-line {\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-primary);\n\toverflow-wrap: anywhere;\n}\n\n.dsp-reveal-option-line-text {\n\twhite-space: pre-wrap;\n\toverflow-wrap: anywhere;\n\tword-break: break-word;\n}\n\n.dsp-reveal-option-line-text-block {\n\twidth: 100%;\n}\n\n.dsp-reveal-analysis {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n\tpadding: 10px 12px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 9px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tmin-width: 0;\n}\n\n.dsp-reveal-analysis-title {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tfont-size: 12.5px;\n\tfont-weight: 600;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-reveal-analysis-body {\n\tfont-size: 12.5px;\n\tline-height: 20px;\n}\n\n.dsp-reveal-grade {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tflex-wrap: wrap;\n\tpadding: 10px 12px;\n\tborder-radius: 9px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary) 30%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 9%, transparent);\n}\n\n.dsp-reveal-grade-text {\n\tfont-size: 12.5px;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-reveal-grade-actions {\n\tflex: none;\n\tflex-wrap: wrap;\n}\n\n.dsp-reveal-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 8px;\n\tflex-wrap: wrap;\n\tpadding-top: 2px;\n}\n\n/* ------------------------------------------------------------------ */\n/* AI 判题建议卡片                                                      */\n/* ------------------------------------------------------------------ */\n\n.dsp-ai-grade {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tpadding: 10px 12px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 24%, transparent);\n\tborder-radius: 9px;\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 4%, transparent);\n\tmin-width: 0;\n\tanimation: dsp-fade-in 0.16s ease;\n}\n\n.dsp-ai-grade-head {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 6px;\n\tmin-width: 0;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-ai-grade-title {\n\tfont-size: 12.5px;\n\tfont-weight: 600;\n\tline-height: 19px;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-ai-grade-time {\n\tmargin-left: auto;\n}\n\n.dsp-ai-grade-summary {\n\tfont-size: 12.5px;\n\tline-height: 20px;\n}\n\n.dsp-ai-grade-block {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 4px;\n\tmin-width: 0;\n}\n\n.dsp-ai-grade-block-title {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 5px;\n\tfont-size: 12px;\n\tfont-weight: 600;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-ai-grade-list {\n\tmargin: 0;\n\tpadding-left: 18px;\n\tfont-size: 12.5px;\n\tline-height: 20px;\n}\n\n.dsp-ai-grade-corrected {\n\tpadding: 8px 10px;\n\tborder: 0.5px dashed var(--dsw-alias-border-l1);\n\tborder-radius: 7px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tfont-size: 12.5px;\n\tline-height: 20px;\n}\n\n.dsp-ai-grade-refs {\n\tmargin-top: 0;\n}\n\n.dsp-grade-btn-correct {\n\tcolor: var(--dsw-alias-state-success-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 35%, transparent);\n}\n\n.dsp-grade-btn-correct:hover:not(:disabled) {\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-success-primary) 10%, transparent);\n}\n\n.dsp-grade-btn-wrong {\n\tcolor: var(--dsw-alias-state-error-primary);\n\tborder-color: color-mix(in srgb, var(--dsw-alias-state-error-primary) 35%, transparent);\n}\n\n.dsp-grade-btn-wrong:hover:not(:disabled) {\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 10%, transparent);\n}\n\n/* ------------------------------------------------------------------ */\n/* 结果页                                                              */\n/* ------------------------------------------------------------------ */\n\n.dsp-result {\n\tgap: 14px;\n}\n\n.dsp-result-hero {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 14px;\n\tpadding: 18px;\n\tflex-wrap: wrap;\n}\n\n.dsp-result-icon {\n\tdisplay: inline-flex;\n\tflex: none;\n\tcolor: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-result-hero-text {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n}\n\n.dsp-result-hero-side {\n\tflex: none;\n}\n\n.dsp-result-stats {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(auto-fit, minmax(132px, 1fr));\n\tgap: 10px;\n}\n\n.dsp-result-stat {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 2px;\n\tpadding: 12px 14px;\n}\n\n.dsp-result-stat-value {\n\tfont-size: 19px;\n\tfont-weight: 600;\n\tline-height: 27px;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-variant-numeric: tabular-nums;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-result-stat-label {\n\tletter-spacing: 0.02em;\n}\n\n.dsp-result-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tflex-wrap: wrap;\n}\n\n/* 题型正确率 */\n.dsp-type-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 9px;\n\tpadding: 14px 16px;\n}\n\n.dsp-type-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 10px;\n\tmin-width: 0;\n\tfont-size: 12px;\n}\n\n.dsp-type-label {\n\tflex: none;\n\twidth: 52px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-type-count {\n\tflex: none;\n\twidth: 58px;\n\ttext-align: right;\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-type-track {\n\tflex: 1 1 auto;\n\tmin-width: 40px;\n\theight: 7px;\n\tborder-radius: 999px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\toverflow: hidden;\n}\n\n.dsp-type-fill {\n\theight: 100%;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-brand-primary);\n\ttransition: width 0.3s ease;\n}\n\n.dsp-type-fill-low {\n\tbackground: var(--dsw-alias-state-warn-primary);\n}\n\n.dsp-type-pct {\n\tflex: none;\n\twidth: 44px;\n\ttext-align: right;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n/* 待自评题目 */\n.dsp-pending-card {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 10px;\n}\n\n.dsp-pending-item {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tpadding: 10px 12px;\n}\n\n.dsp-pending-head {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-pending-number {\n\tflex: none;\n\tfont-size: 12.5px;\n\tfont-weight: 600;\n\tline-height: 20px;\n}\n\n.dsp-pending-stem {\n\tflex: 1 1 auto;\n\tmin-width: 0;\n\tfont-size: 12px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-pending-answers {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 3px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-pending-answer {\n\toverflow-wrap: anywhere;\n\twhite-space: pre-wrap;\n}\n\n.dsp-pending-actions {\n\tjustify-content: flex-end;\n\tflex-wrap: wrap;\n}\n\n/* 学情分析 / 复习建议 */\n.dsp-result-analysis {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 10px;\n}\n\n.dsp-analysis-progress {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 6px;\n}\n\n.dsp-analysis-body {\n\tpadding-top: 10px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n/* ------------------------------------------------------------------ */\n/* 窄屏 / 中间区被压缩时保持可用                                       */\n/* ------------------------------------------------------------------ */\n\n@media (max-width: 1200px) {\n\t.dsp-practice-inner {\n\t\tmax-width: none;\n\t\tpadding: 14px 16px 32px;\n\t}\n\n\t.dsp-practice-head {\n\t\tpadding: 10px 14px 8px;\n\t}\n\n\t.dsp-practice-head-progress {\n\t\tpadding: 0 14px 8px;\n\t}\n\n\t.dsp-practice-foot {\n\t\tpadding: 8px 14px;\n\t}\n\n\t.dsp-question {\n\t\tpadding: 14px;\n\t}\n\n\t.dsp-result-hero {\n\t\tpadding: 14px;\n\t}\n}\n\n@media (max-width: 900px) {\n\t.dsp-mode-grid {\n\t\tgrid-template-columns: minmax(0, 1fr);\n\t}\n\n\t.dsp-practice-head-meta {\n\t\tjustify-content: flex-start;\n\t}\n\n\t.dsp-practice-sub {\n\t\tdisplay: none;\n\t}\n\n\t.dsp-practice-inner {\n\t\tgap: 11px;\n\t}\n\n\t.dsp-reveal-actions {\n\t\tjustify-content: flex-start;\n\t}\n}\n\n@media (max-width: 640px) {\n\t.dsp-practice-inner {\n\t\tpadding: 12px 12px 28px;\n\t}\n\n\t.dsp-practice-foot-left,\n\t.dsp-practice-foot-right {\n\t\tflex: 1 1 100%;\n\t\tjustify-content: space-between;\n\t}\n\n\t.dsp-figure-img {\n\t\tmax-height: 300px;\n\t}\n\n\t.dsp-result-stats {\n\t\tgrid-template-columns: repeat(2, minmax(0, 1fr));\n\t}\n\n\t.dsp-type-count {\n\t\tdisplay: none;\n\t}\n}\n\n/* 固定图片面板：窄屏时收窄分隔条，保证题目区可用 */\n@media (max-width: 900px) {\n\t.dsp-practice-splitter {\n\t\twidth: 4px;\n\t}\n\n\t.dsp-practice-splitter::after {\n\t\tleft: 1px;\n\t}\n\n\t.dsp-practice-image-pane-zoom .dsp-btn {\n\t\tpadding: 0 4px;\n\t}\n\n\t.dsp-practice-image-pane-canvas {\n\t\tpadding: 6px;\n\t}\n}\n\n/* ------------------------------------------------------------------ */\n/* 标准答案图片 / 更紧凑的判题排版                                      */\n/* ------------------------------------------------------------------ */\n\n.dsp-answer-figures {\n\tdisplay: flex;\n\tflex-wrap: wrap;\n\tgap: 8px;\n\tmargin: 6px 0 2px;\n\tmin-width: 0;\n}\n\n.dsp-answer-figure {\n\tmax-width: min(100%, 420px);\n\tmax-height: 240px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 7px;\n\tbackground: var(--dsw-alias-bg-elevated, #fff);\n\tobject-fit: contain;\n}\n\n.dsp-ai-grade {\n\tgap: 6px;\n\tpadding: 9px 11px;\n}\n\n.dsp-ai-grade-block-title {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n}\n\n.dsp-ai-grade-summary {\n\tfont-size: 12px;\n\tline-height: 19px;\n}\n\n.dsp-ai-grade .dsp-md p {\n\tmargin: 0 0 4px;\n}\n\n.dsp-ai-grade .dsp-md p:last-child {\n\tmargin-bottom: 0;\n}\n/* ==== src/client/css/rail.css ==== */\n/* 刷题模式 — 课程栏（DSP.Rail）与课程主页（DSP.CourseHome）样式（course-ui-dev）。\n * 颜色只使用 --dsw-alias-* 主题 token；布局在 900–1600px 宽度下稳定。\n */\n\n/* ------------------------------------------------------------------ */\n/* 左课程栏                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-rail-new {\n\tflex: none;\n\t/* 品牌行已移除：左栏顶部保留 14px 内边距，不贴边。 */\n\tpadding: 14px 12px 10px;\n}\n\n.dsp-rail-scroll {\n\tflex: 1 1 auto;\n\tmin-height: 0;\n\toverflow-y: auto;\n\toverflow-x: hidden;\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.dsp-rail-section {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 8px;\n\tpadding: 2px 14px 6px;\n\tfont-size: 11px;\n\tline-height: 16px;\n\tletter-spacing: 0.02em;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-rail-section-title {\n\tfont-weight: 600;\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-rail-section-count {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tmin-width: 18px;\n\theight: 16px;\n\tpadding: 0 5px;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 10.5px;\n}\n\n.dsp-rail-list {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 2px;\n\tpadding: 0 8px 12px;\n}\n\n.dsp-rail-course {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 2px;\n\talign-items: stretch;\n\tmin-width: 0;\n\twidth: 100%;\n\tpadding: 7px 8px;\n\tborder: 0;\n\tborder-radius: 8px;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-primary);\n\ttext-align: left;\n\tcursor: pointer;\n}\n\n.dsp-rail-course:hover {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-rail-course:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: -1px;\n}\n\n.dsp-rail-course-active {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);\n}\n\n.dsp-rail-course-active:hover {\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent);\n}\n\n.dsp-rail-course-active .dsp-rail-course-name {\n\tcolor: var(--dsw-alias-brand-primary);\n\tfont-weight: 600;\n}\n\n.dsp-rail-course-name {\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-rail-course-meta {\n\tfont-size: 11px;\n\tline-height: 15px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-rail-empty {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 4px;\n\tpadding: 16px 14px;\n\ttext-align: center;\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-rail-empty-title {\n\tfont-weight: 600;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-rail-empty-hint {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-rail-foot {\n\tflex: none;\n\tpadding: 10px 12px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: inherit;\n}\n\n.dsp-rail-global-active {\n\tborder-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 42%, transparent);\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n/* ------------------------------------------------------------------ */\n/* 课程主页                                                            */\n/* ------------------------------------------------------------------ */\n\n.dsp-course-head {\n\tflex-wrap: wrap;\n}\n\n.dsp-course-head-main {\n\tflex: 1 1 260px;\n\tmin-width: 0;\n}\n\n.dsp-course-head-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tgap: 8px;\n\tflex-wrap: wrap;\n\tflex: none;\n}\n\n.dsp-course-title-row {\n\talign-items: center;\n\tgap: 2px;\n}\n\n.dsp-course-page .dsp-page-title {\n\tmin-width: 0;\n}\n\n.dsp-course-desc {\n\tmax-width: 720px;\n\tdisplay: -webkit-box;\n\t-webkit-line-clamp: 2;\n\t-webkit-box-orient: vertical;\n\toverflow: hidden;\n}\n\n.dsp-chips {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 6px;\n\tmargin-top: 4px;\n}\n\n.dsp-chip {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tgap: 5px;\n\theight: 24px;\n\tpadding: 0 9px;\n\tborder-radius: 999px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tfont-size: 11.5px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n}\n\n.dsp-chip-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tcolor: var(--dsw-alias-brand-primary);\n}\n\n.dsp-chip-label {\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-chip-value {\n\tfont-weight: 600;\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-section-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tcolor: var(--dsw-alias-brand-primary);\n\tflex: none;\n}\n\n.dsp-count-badge {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tmin-width: 20px;\n\theight: 18px;\n\tpadding: 0 6px;\n\tborder-radius: 999px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 11px;\n\tline-height: 16px;\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-set-section,\n.dsp-doc-section {\n\ttransition: border-color 0.12s ease, background 0.12s ease;\n}\n\n.dsp-drop-active {\n\tborder-color: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-1));\n\tbox-shadow: 0 0 0 1px color-mix(in srgb, var(--dsw-alias-brand-primary) 26%, transparent);\n}\n\n/* 拖拽悬停时区块内的「松开以上传…」提示 */\n.dsp-drop-hint {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 8px;\n\tmargin: 2px 0 10px;\n\tpadding: 16px 14px;\n\tborder: 1px dashed color-mix(in srgb, var(--dsw-alias-brand-primary) 56%, transparent);\n\tborder-radius: 9px;\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 8%, transparent);\n\tcolor: var(--dsw-alias-brand-primary);\n\tfont-size: 13px;\n\tline-height: 19px;\n\tfont-weight: 600;\n\ttext-align: center;\n}\n\n.dsp-set-list {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n}\n\n.dsp-set-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 12px;\n\tflex-wrap: wrap;\n\tpadding: 10px 12px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 9px;\n\tbackground: var(--dsw-alias-bg-base);\n\tmin-width: 0;\n}\n\n.dsp-set-main {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 4px;\n\tflex: 1 1 220px;\n\tmin-width: 0;\n}\n\n.dsp-set-title-row {\n\tmin-width: 0;\n\tflex-wrap: wrap;\n}\n\n.dsp-set-title {\n\tfont-size: 13px;\n\tline-height: 19px;\n\tfont-weight: 600;\n\tmin-width: 0;\n}\n\n.dsp-set-meta {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 2px 8px;\n}\n\n.dsp-set-meta-sep {\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\topacity: 0.7;\n}\n\n.dsp-set-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: flex-end;\n\tflex-wrap: wrap;\n\tgap: 6px;\n\tflex: none;\n\tmargin-left: auto;\n}\n\n.dsp-set-progress {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 5px;\n\tmargin-top: 2px;\n}\n\n/* 「含答案文件」标签（title 里带答案文件名） */\n.dsp-set-answer-tag {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tmin-width: 0;\n\tflex: none;\n}\n\n/* 套题卡片上的 AI 答案解析模式三选一（auto / off / regenerate） */\n.dsp-set-ai-row {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 6px 8px;\n\tmargin-top: 2px;\n\tmin-width: 0;\n}\n\n.dsp-set-ai-label {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n}\n\n.dsp-set-ai-control {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 2px;\n\tpadding: 2px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 8px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tmax-width: 100%;\n}\n\n.dsp-set-ai-option {\n\theight: 22px;\n\tpadding: 0 8px;\n\tborder: 0;\n\tborder-radius: 6px;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 11.5px;\n\tline-height: 16px;\n\twhite-space: nowrap;\n\tcursor: pointer;\n}\n\n.dsp-set-ai-option:hover:not(:disabled) {\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-set-ai-option-active {\n\tbackground: var(--dsw-alias-bg-layer-1);\n\tcolor: var(--dsw-alias-label-primary);\n\tfont-weight: 600;\n\tbox-shadow: 0 0 0 0.5px var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n}\n\n.dsp-set-ai-option:disabled {\n\topacity: 0.55;\n\tcursor: default;\n}\n\n.dsp-set-ai-option:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-set-ai-hint {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\twhite-space: nowrap;\n}\n\n.dsp-inline-error {\n\tpadding: 7px 10px;\n\tborder-radius: 8px;\n\tborder: 0.5px solid color-mix(in srgb, var(--dsw-alias-state-error-primary) 34%, transparent);\n\tbackground: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent);\n\tcolor: var(--dsw-alias-state-error-primary);\n\tfont-size: 12px;\n\tline-height: 18px;\n\toverflow-wrap: anywhere;\n}\n\n.dsp-upload-status {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 7px;\n\tpadding: 7px 2px;\n}\n\n.dsp-upload-actions {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tflex-wrap: wrap;\n\tflex: none;\n}\n\n.dsp-doc-list {\n\tdisplay: flex;\n\tflex-direction: column;\n}\n\n.dsp-doc-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 10px;\n\tpadding: 9px 2px;\n\tborder-bottom: 0.5px solid var(--dsw-alias-border-l1);\n\tmin-width: 0;\n}\n\n.dsp-doc-row:last-child {\n\tborder-bottom: 0;\n}\n\n/* 课程文档按目录分组：分组头（folder + 路径 + 数量）+ 组内缩进的文件行 */\n.dsp-doc-group {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n}\n\n.dsp-doc-group + .dsp-doc-group {\n\tmargin-top: 4px;\n\tpadding-top: 2px;\n\tborder-top: 0.5px solid var(--dsw-alias-border-l1);\n}\n\n.dsp-doc-group-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tpadding: 8px 2px 4px;\n\tmin-width: 0;\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-doc-group-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tflex: none;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-doc-group-path {\n\tfont-weight: 600;\n\tmin-width: 0;\n}\n\n.dsp-doc-group-count {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\tmin-width: 18px;\n\theight: 16px;\n\tpadding: 0 5px;\n\tflex: none;\n\tborder-radius: 999px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-size: 10.5px;\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-doc-group-body {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n\tpadding-left: 22px;\n}\n\n.dsp-doc-group-body .dsp-doc-row {\n\tpadding-left: 0;\n}\n\n.dsp-doc-group-body .dsp-doc-row:last-child {\n\tborder-bottom: 0;\n}\n\n/* 课程文档区块折叠：整行标题可点击，默认收起；展开后才渲染上传按钮与列表 */\n.dsp-doc-section {\n\tpadding: 10px 16px;\n}\n\n.dsp-doc-section-head {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\twidth: 100%;\n\tmin-width: 0;\n\tmargin: -4px -6px;\n\tpadding: 4px 6px;\n\tborder: 0;\n\tborder-radius: 8px;\n\tbackground: transparent;\n\tcolor: var(--dsw-alias-label-primary);\n\ttext-align: left;\n\tcursor: pointer;\n}\n\n.dsp-doc-section-head:hover {\n\tbackground: var(--dsw-alias-interactive-bg-hover, var(--dsw-alias-bg-layer-2));\n}\n\n.dsp-doc-section-head:focus-visible {\n\toutline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));\n\toutline-offset: 1px;\n}\n\n.dsp-doc-section-head .dsp-section-title {\n\tmin-width: 0;\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-doc-summary {\n\tfont-size: 11.5px;\n\tline-height: 17px;\n\tcolor: var(--dsw-alias-label-secondary);\n\twhite-space: nowrap;\n\toverflow: hidden;\n\ttext-overflow: ellipsis;\n}\n\n.dsp-doc-chevron {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tmargin-left: auto;\n\tflex: none;\n\tcolor: var(--dsw-alias-label-secondary);\n\ttransform: rotate(-90deg);\n\ttransition: transform 0.15s ease;\n}\n\n.dsp-doc-section-head-open .dsp-doc-chevron {\n\ttransform: rotate(0deg);\n}\n\n.dsp-doc-section-body {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 10px;\n\tmargin-top: 10px;\n\tmin-width: 0;\n}\n\n.dsp-doc-section-body .dsp-upload-actions {\n\tjustify-content: flex-start;\n}\n\n.dsp-doc-section-body .dsp-empty {\n\tpadding-top: 18px;\n\tpadding-bottom: 18px;\n}\n\n.dsp-doc-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tjustify-content: center;\n\twidth: 28px;\n\theight: 28px;\n\tflex: none;\n\tborder-radius: 7px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-doc-main {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 2px;\n\tflex: 1 1 auto;\n\tmin-width: 0;\n}\n\n.dsp-doc-title-row {\n\tmin-width: 0;\n}\n\n.dsp-doc-name {\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\tmin-width: 0;\n}\n\n.dsp-doc-meta {\n\tdisplay: flex;\n\talign-items: center;\n\tflex-wrap: wrap;\n\tgap: 2px 8px;\n\tmin-width: 0;\n}\n\n.dsp-doc-status-success {\n\tcolor: var(--dsw-alias-state-success-primary);\n}\n\n.dsp-doc-status-warn {\n\tcolor: var(--dsw-alias-state-warn-primary);\n}\n\n.dsp-doc-status-error {\n\tcolor: var(--dsw-alias-state-error-primary);\n}\n\n.dsp-file-input {\n\tposition: absolute;\n\twidth: 1px;\n\theight: 1px;\n\tpadding: 0;\n\tmargin: -1px;\n\toverflow: hidden;\n\tclip: rect(0 0 0 0);\n\twhite-space: nowrap;\n\tborder: 0;\n}\n\n@media (max-width: 1100px) {\n\t.dsp-course-head-actions {\n\t\tjustify-content: flex-start;\n\t\twidth: 100%;\n\t}\n}\n\n@media (max-width: 720px) {\n\t.dsp-set-row {\n\t\talign-items: stretch;\n\t}\n\n\t.dsp-set-actions {\n\t\twidth: 100%;\n\t\tmargin-left: 0;\n\t\tjustify-content: flex-end;\n\t}\n}\n\n/* ------------------------------------------------------------------ */\n/* 左栏移除后：课程主页内容居中并增加左右留白                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-course-page .dsp-page-head,\n.dsp-course-page .dsp-page-body {\n\twidth: 100%;\n\tmax-width: 1200px;\n\tmargin-left: auto;\n\tmargin-right: auto;\n\tpadding-left: 32px;\n\tpadding-right: 32px;\n}\n\n@media (max-width: 1100px) {\n\t.dsp-course-page .dsp-page-head,\n\t.dsp-course-page .dsp-page-body {\n\t\tpadding-left: 22px;\n\t\tpadding-right: 22px;\n\t}\n}\n\n/* ------------------------------------------------------------------ */\n/* 「上传题目」弹窗（试卷文件 + 可选答案文件）                          */\n/* ------------------------------------------------------------------ */\n\n.dsp-upload-modal {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 14px;\n\tmin-width: 0;\n}\n\n.dsp-upload-group {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tmin-width: 0;\n}\n\n.dsp-upload-group-head {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: space-between;\n\tgap: 10px;\n\tmin-width: 0;\n}\n\n.dsp-upload-group-title {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 6px;\n\tmin-width: 0;\n\tfont-size: 12.5px;\n\tline-height: 18px;\n\tfont-weight: 600;\n\tcolor: var(--dsw-alias-label-primary);\n}\n\n.dsp-upload-optional {\n\tfont-size: 11px;\n\tline-height: 16px;\n\tfont-weight: 400;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n}\n\n.dsp-upload-drop {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 8px;\n\tmin-width: 0;\n\tpadding: 10px;\n\tborder: 0.5px dashed var(--dsw-alias-border-l2, var(--dsw-alias-border-l1));\n\tborder-radius: 10px;\n\tbackground: var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1));\n\ttransition: border-color 0.12s ease, background 0.12s ease;\n}\n\n.dsp-upload-drop.dsp-drop-active {\n\tborder-color: var(--dsw-alias-brand-primary);\n\tbackground: color-mix(in srgb, var(--dsw-alias-brand-primary) 7%, var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1)));\n}\n\n.dsp-upload-drop .dsp-drop-hint {\n\tmargin: 0;\n\tpadding: 12px;\n}\n\n.dsp-upload-empty {\n\tdisplay: flex;\n\talign-items: center;\n\tjustify-content: center;\n\tmin-height: 52px;\n\tpadding: 10px;\n\ttext-align: center;\n\tfont-size: 12px;\n\tline-height: 18px;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-upload-file-list {\n\tdisplay: flex;\n\tflex-direction: column;\n\tgap: 4px;\n\tmax-height: 190px;\n\toverflow-y: auto;\n\tmin-width: 0;\n}\n\n.dsp-upload-file-row {\n\tdisplay: flex;\n\talign-items: center;\n\tgap: 8px;\n\tmin-width: 0;\n\tpadding: 5px 6px;\n\tborder: 0.5px solid var(--dsw-alias-border-l1);\n\tborder-radius: 7px;\n\tbackground: var(--dsw-alias-bg-layer-1);\n}\n\n.dsp-upload-file-icon {\n\tdisplay: inline-flex;\n\talign-items: center;\n\tflex: none;\n\tcolor: var(--dsw-alias-label-secondary);\n}\n\n.dsp-upload-file-main {\n\tdisplay: flex;\n\tflex-direction: column;\n\tmin-width: 0;\n\tflex: 1 1 auto;\n}\n\n.dsp-upload-file-name {\n\tfont-size: 12px;\n\tline-height: 17px;\n\tmin-width: 0;\n}\n\n.dsp-upload-file-path {\n\tfont-size: 10.5px;\n\tline-height: 15px;\n\tcolor: var(--dsw-alias-label-tertiary, var(--dsw-alias-label-secondary));\n\tmin-width: 0;\n}\n\n.dsp-upload-file-size {\n\tflex: none;\n\tfont-size: 11px;\n\tline-height: 16px;\n\tcolor: var(--dsw-alias-label-secondary);\n\tfont-variant-numeric: tabular-nums;\n}\n\n.dsp-upload-modal .dsp-inline-error {\n\tmargin-top: 2px;\n}";

/* ==== src/client/10-utils.js ==== */
/* 刷题模式 Client — 基础工具（Lead 维护）。
 * 这里只放所有 UI 片段共享的底层能力：DSP 命名空间、i18n 回落、图标、按钮/弹窗等
 * 轻量原语、markdown 渲染、HTTP 客户端、SSE 解析与格式化工具。
 */

var DSP = (window.__DSP = window.__DSP || {});
DSP.h = h;
DSP.React = React;

/* ------------------------------------------------------------------ */
/* i18n：读 Client locale 服务；UI 以中文为主，英文用常见词条回落映射。 */
/* ------------------------------------------------------------------ */

var __localeService = null;
var __localeListeners = new Set();

DSP.initLocale = function initLocale(ctx) {
	try {
		__localeService = ctx && typeof ctx.get === 'function' ? (ctx.get('locale') || ctx.locale || null) : (ctx && ctx.locale) || null;
	} catch (error) {
		__localeService = null;
	}
	if (__localeService && typeof __localeService.subscribe === 'function') {
		try {
			__localeService.subscribe(function () {
				Array.from(__localeListeners).forEach(function (listener) {
					try {
						listener();
					} catch (error) {
						/* ignore one broken listener */
					}
				});
			});
		} catch (error) {
			/* locale subscription is best-effort */
		}
	}
};

DSP.subscribeLocale = function subscribeLocale(listener) {
	__localeListeners.add(listener);
	return function () {
		__localeListeners.delete(listener);
	};
};

function currentLocaleId() {
	try {
		const snapshot = __localeService && typeof __localeService.getLocale === 'function' ? __localeService.getLocale() : null;
		const id = snapshot && (snapshot.id || snapshot.locale || snapshot.language);
		return typeof id === 'string' ? id : 'zh';
	} catch (error) {
		return 'zh';
	}
}

DSP.localeId = currentLocaleId;

var EN_MAP = {
	刷题模式: 'Practice Mode',
	新会话: 'New chat',
	答疑助手: 'Study Assistant',
	新建课程: 'New course',
	所有课程: 'All courses',
	所有课程看板: 'All-course dashboard',
	课程文档: 'Course materials',
	题目集: 'Question sets',
	上传题目文件: 'Upload question file',
	上传课程文档: 'Upload course material',
	上传文件夹: 'Upload folder',
	支持: 'Supported: ',
	开始刷题: 'Start practice',
	继续刷题: 'Continue practice',
	重新练习: 'Practice again',
	查看解析: 'Review explanations',
	删除: 'Delete',
	取消: 'Cancel',
	确认: 'Confirm',
	保存: 'Save',
	关闭: 'Close',
	发送: 'Send',
	提交: 'Submit',
	上一题: 'Previous',
	下一题: 'Next',
	交卷: 'Finish set',
	正确答案: 'Answer',
	解析: 'Explanation',
	一键提问: 'Ask about this',
	重新绘制示图: 'Redraw figure',
	正在思考: 'Thinking',
	正在解析: 'Parsing',
	正在生成: 'Generating',
	正确: 'Correct',
	错误: 'Incorrect',
	已答: 'Answered',
	未答: 'Unanswered',
	跳过: 'Skip',
	单选: 'Single choice',
	多选: 'Multiple choice',
	判断: 'True / false',
	填空: 'Fill in the blank',
	简答: 'Short answer',
	其他: 'Other',
	难度: 'Difficulty',
	考点: 'Topics',
	错题: 'Wrong answers',
	易错点: 'Common mistakes',
	复习重点: 'Review focus',
	复习方案: 'Review plan',
	学情分析: 'Learning analysis',
	生成复习方案: 'Generate review plan',
	刷新分析: 'Refresh analysis',
	最近刷题: 'Recent practice',
	还没有数据: 'No data yet',
	第: 'No. ',
	题: '',
	无题目: 'No questions',
	课程名称: 'Course name',
	课程简介: 'Course description',
	可选: 'optional',
	学习看板: 'Dashboard',
	正确率: 'Accuracy',
	题型分布: 'By question type',
	最近趋势: 'Recent trend',
	刷题总数: 'Attempts',
	已刷套数: 'Sets completed',
	平均用时: 'Average time',
	查看全部: 'View all',
	暂无课程: 'No courses yet',
	新建课程即可上传课程文档与题目文件: 'Create a course to upload materials and questions.',
	选择题: 'Choice',
	材料: 'Material',
	共用材料: 'Shared material',
	图片: 'Image',
	选中文字: 'Selected text',
	附加到对话: 'Attach to chat',
	提问: 'Ask',
	清空对话: 'Clear chat',
	新对话: 'New conversation',
	基于课程文档与所选文字回答: 'Answers grounded in course materials and your selection.',
	输入问题: 'Type your question',
	回车发送: 'Enter to send',
	课程: 'Course',
	返回课程: 'Back to course',
	本套统计: 'Set summary',
	上传下一套: 'Upload next set',
	解析失败: 'Parsing failed',
	重试: 'Retry',
	完成: 'Done',
	数据: 'Data',
	全局: 'Global',
	全部错题: 'All wrong answers',
	暂无错题: 'No wrong answers yet',
	题目: 'Question',
	你的答案: 'Your answer',
	未作答: 'No answer',
	用时: 'Time spent',
	本次正确率: 'Accuracy this set',
	上传中: 'Uploading',
	请选择文件: 'Choose files',
	课程已创建: 'Course created',
	题目已解析: 'Questions parsed',
	已附加到右侧对话: 'Attached to the chat',
	复制: 'Copy',
	已复制: 'Copied',
	明细: 'Details',
	暂无解析: 'No explanation yet',
	暂无课程文档: 'No course materials yet',
	文档抽取完成: 'Material indexed',
	文档抽取失败: 'Failed to index material',
	图片识别: 'Figure',
	模式: 'Mode',
	答一题看一题: 'Reveal after each question',
	全部做完再看: 'Reveal after the whole set',
	开始: 'Start',
	继续: 'Continue'
};

DSP.t = function t(zhText) {
	if (typeof zhText !== 'string') return zhText;
	const id = currentLocaleId();
	if (typeof id === 'string' && id.toLowerCase().indexOf('zh') === 0) return zhText;
	return EN_MAP[zhText] || zhText;
};

/* ------------------------------------------------------------------ */
/* 图标                                                               */
/* ------------------------------------------------------------------ */

var ICON_PATHS = {
	logo: [
		'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z',
		'M8 7.5h8M8 11h6',
		'M4 17.5c0-1.4 1.1-2.5 2.5-2.5H20'
	],
	plus: ['M12 5v14M5 12h14'],
	minus: ['M5 12h14'],
	upload: ['M12 16V4', 'M7 9l5-5 5 5', 'M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3'],
	folder: ['M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
	doc: ['M6 3h8l4 4v14H6z', 'M14 3v5h5', 'M9 12h6M9 16h6'],
	image: ['M3 5h18v14H3z', 'M3 15l5-5 4 4 3-3 6 6', 'M15.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'],
	trash: ['M4 7h16', 'M9 7V4h6v3', 'M6 7l1 13h10l1-13', 'M10 11v6M14 11v6'],
	chat: ['M4 5h16v11H9l-5 4z'],
	send: ['M4 12l16-8-6 16-3-6z', 'M11 14l9-10'],
	sparkles: ['M12 3l1.8 4.6L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.9z', 'M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z'],
	check: ['M4 12.5l5 5L20 6.5'],
	checkCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M8 12.5l3 3 5-6'],
	closeCircle: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M9 9l6 6M15 9l-6 6'],
	x: ['M6 6l12 12M18 6L6 18'],
	chevronDown: ['M6 9l6 6 6-6'],
	chevronLeft: ['M15 6l-6 6 6 6'],
	chevronRight: ['M9 6l6 6-6 6'],
	book: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z', 'M8 7.5h8M8 11h6'],
	chart: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
	refresh: ['M20 11a8 8 0 1 0-2.3 6.6', 'M20 4v7h-7'],
	arrowLeft: ['M19 12H5', 'M11 6l-6 6 6 6'],
	clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
	search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M16.5 16.5L21 21'],
	edit: ['M4 20h4L20 8l-4-4L4 16z', 'M13 5l4 4'],
	more: ['M6 12h.01M12 12h.01M18 12h.01'],
	alert: ['M12 3l9.5 17H2.5z', 'M12 9v5M12 17h.01'],
	bulb: ['M9 18h6', 'M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2h5c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z'],
	target: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z'],
	list: ['M8 6h13M8 12h13M8 18h13', 'M3.5 6h.01M3.5 12h.01M3.5 18h.01'],
	play: ['M7 4l13 8-13 8z'],
	eye: ['M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
	copy: ['M9 9h11v12H9z', 'M4 15V3h11'],
	flag: ['M5 21V4', 'M5 4h11l-1.5 4L16 12H5'],
	layers: ['M12 3l9 5-9 5-9-5z', 'M3 13l9 5 9-5'],
	robot: ['M5 8h14v10H5z', 'M12 4v4', 'M9 12h.01M15 12h.01', 'M9 18v3M15 18v3'],
	bookmark: ['M6 3h12v18l-6-4-6 4z'],
	dot: ['M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z']
};

function Icon(props) {
	const name = props && props.name ? String(props.name) : 'dot';
	const paths = ICON_PATHS[name] || ICON_PATHS.dot;
	const size = (props && props.size) || 16;
	const children = paths.map(function (d, index) {
		return h('path', { key: index, d: d, fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' });
	});
	return h(
		'svg',
		{
			className: 'dsp-icon' + (props && props.className ? ' ' + props.className : ''),
			viewBox: '0 0 24 24',
			width: size,
			height: size,
			role: props && props.title ? 'img' : undefined,
			'aria-hidden': props && props.title ? undefined : true,
			'aria-label': props && props.title ? props.title : undefined,
			focusable: 'false'
		},
		props && props.title ? h('title', null, props.title) : null,
		children
	);
}

DSP.Icon = Icon;

/* ------------------------------------------------------------------ */
/* 基础原语                                                           */
/* ------------------------------------------------------------------ */

function joinClass() {
	const parts = [];
	for (let index = 0; index < arguments.length; index += 1) {
		const value = arguments[index];
		if (typeof value === 'string' && value.length > 0) parts.push(value);
	}
	return parts.join(' ');
}

DSP.cls = joinClass;

function Spinner(props) {
	const size = (props && props.size) || 16;
	return h('span', { className: 'dsp-spinner', style: { width: size + 'px', height: size + 'px' }, 'aria-hidden': 'true' });
}

DSP.Spinner = Spinner;

function Btn(props) {
	const p = props || {};
	const variant = p.variant || 'secondary';
	const children = [];
	if (p.loading) children.push(h(Spinner, { key: 'spinner', size: 14 }));
	else if (p.icon) children.push(h(Icon, { key: 'icon', name: p.icon, size: p.iconSize || 16 }));
	if (p.children !== undefined && p.children !== null && p.children !== false) children.push(h('span', { key: 'label', className: 'dsp-btn-label' }, p.children));
	return h(
		'button',
		{
			type: 'button',
			className: joinClass('dsp-btn', 'dsp-btn-' + variant, p.block ? 'dsp-btn-block' : '', p.className || ''),
			disabled: Boolean(p.disabled) || Boolean(p.loading),
			onClick: p.onClick,
			title: p.title,
			'aria-label': p.ariaLabel,
			style: p.style
		},
		children
	);
}

DSP.Btn = Btn;

function IconBtn(props) {
	const p = props || {};
	return h(
		'button',
		{
			type: 'button',
			className: joinClass('dsp-icon-btn', p.danger ? 'dsp-icon-btn-danger' : '', p.active ? 'dsp-icon-btn-active' : '', p.className || ''),
			onClick: p.onClick,
			disabled: Boolean(p.disabled),
			title: p.title || p.label,
			'aria-label': p.label || p.title
		},
		h(Icon, { name: p.icon, size: p.size || 16 })
	);
}

DSP.IconBtn = IconBtn;

function Tag(props) {
	const p = props || {};
	return h('span', { className: joinClass('dsp-tag', 'dsp-tag-' + (p.tone || 'neutral'), p.className || '') }, p.children);
}

DSP.Tag = Tag;

function Empty(props) {
	const p = props || {};
	return h(
		'div',
		{ className: 'dsp-empty' + (p.className ? ' ' + p.className : '') },
		p.icon ? h('div', { className: 'dsp-empty-icon' }, h(Icon, { name: p.icon, size: 30 })) : null,
		h('div', { className: 'dsp-empty-title' }, p.title || ''),
		p.children ? h('div', { className: 'dsp-empty-text' }, p.children) : null,
		p.action ? h('div', { className: 'dsp-empty-action' }, p.action) : null
	);
}

DSP.Empty = Empty;

function Field(props) {
	const p = props || {};
	return h(
		'label',
		{ className: 'dsp-field' + (p.className ? ' ' + p.className : '') },
		p.label ? h('span', { className: 'dsp-field-label' }, p.label, p.optional ? h('span', { className: 'dsp-field-optional' }, '(' + DSP.t('可选') + ')') : null) : null,
		p.children,
		p.hint ? h('span', { className: 'dsp-field-hint' }, p.hint) : null,
		p.error ? h('span', { className: 'dsp-field-error' }, p.error) : null
	);
}

DSP.Field = Field;

function ProgressBar(props) {
	const p = props || {};
	const value = Math.max(0, Math.min(1, Number(p.value) || 0));
	return h(
		'div',
		{ className: 'dsp-progress' + (p.className ? ' ' + p.className : ''), role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(value * 100) },
		h('div', { className: 'dsp-progress-fill', style: { width: Math.round(value * 100) + '%' } })
	);
}

DSP.ProgressBar = ProgressBar;

function Segmented(props) {
	const p = props || {};
	const options = p.options || [];
	return h(
		'div',
		{ className: 'dsp-segmented' + (p.className ? ' ' + p.className : ''), role: 'tablist' },
		options.map(function (option) {
			const active = option.value === p.value;
			return h(
				'button',
				{
					key: option.value,
					type: 'button',
					role: 'tab',
					'aria-selected': active,
					className: 'dsp-segmented-item' + (active ? ' dsp-segmented-active' : ''),
					onClick: function () {
						if (typeof p.onChange === 'function') p.onChange(option.value);
					}
				},
				option.label
			);
		})
	);
}

DSP.Segmented = Segmented;

function Toggle(props) {
	const p = props || {};
	return h(
		'button',
		{
			type: 'button',
			role: 'switch',
			'aria-checked': Boolean(p.checked),
			className: 'dsp-toggle' + (p.checked ? ' dsp-toggle-on' : ''),
			onClick: function () {
				if (typeof p.onChange === 'function') p.onChange(!p.checked);
			}
		},
		h('span', { className: 'dsp-toggle-thumb' })
	);
}

DSP.Toggle = Toggle;

/* 轻量弹窗：无 portal，覆盖在本组件树之上（App 根节点内固定定位）。 */
function Modal(props) {
	const p = props || {};
	React.useEffect(
		function () {
			if (!p.open) return undefined;
			function onKeyDown(event) {
				if (event.key === 'Escape' && typeof p.onClose === 'function') p.onClose();
			}
			window.addEventListener('keydown', onKeyDown);
			return function () {
				window.removeEventListener('keydown', onKeyDown);
			};
		},
		[p.open, p.onClose]
	);
	if (!p.open) return null;
	return h(
		'div',
		{ className: 'dsp-modal-mask', role: 'presentation', onMouseDown: function (event) { if (event.target === event.currentTarget && typeof p.onClose === 'function') p.onClose(); } },
		h(
			'div',
			{ className: 'dsp-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': p.title || 'dialog', style: p.width ? { width: p.width } : undefined },
			h(
				'div',
				{ className: 'dsp-modal-head' },
				h('div', { className: 'dsp-modal-title' }, p.title || ''),
				h(IconBtn, { icon: 'x', label: DSP.t('关闭'), onClick: p.onClose })
			),
			h('div', { className: 'dsp-modal-body' }, p.children),
			p.footer ? h('div', { className: 'dsp-modal-foot' }, p.footer) : null
		)
	);
}

DSP.Modal = Modal;

/* ------------------------------------------------------------------ */
/* Markdown 渲染（无外部依赖，容错流式文本）                           */
/* ------------------------------------------------------------------ */

function isBlockStart(line) {
	return /^(#{1,6}\s|```|\s*[-*+]\s|\s*\d+[.)]\s|>\s?|\|)/.test(line) || /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function renderInline(text, prefix) {
	const nodes = [];
	const source = String(text == null ? '' : text);
	const pattern = /(`[^`]*`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\n]+\*)|(_[^_\n]+_)|(~~[^~]+~~)|(\[[^\]]*\]\([^)\s]+\))/g;
	let last = 0;
	let match;
	let index = 0;
	while ((match = pattern.exec(source)) !== null) {
		if (match.index > last) nodes.push(source.slice(last, match.index));
		const token = match[0];
		const key = prefix + '-i' + index;
		index += 1;
		if (token.charAt(0) === '`') {
			nodes.push(h('code', { key: key, className: 'dsp-md-code' }, token.slice(1, -1)));
		} else if (token.indexOf('**') === 0 || token.indexOf('__') === 0) {
			nodes.push(h('strong', { key: key }, token.slice(2, -2)));
		} else if (token.indexOf('~~') === 0) {
			nodes.push(h('del', { key: key }, token.slice(2, -2)));
		} else if (token.charAt(0) === '*') {
			nodes.push(h('em', { key: key }, token.slice(1, -1)));
		} else if (token.charAt(0) === '_') {
			nodes.push(h('em', { key: key }, token.slice(1, -1)));
		} else if (token.charAt(0) === '[') {
			const linkMatch = /^\[([^\]]*)\]\(([^)\s]+)\)$/.exec(token);
			if (linkMatch) {
				const safe = /^(https?:\/\/|mailto:|#|\/|api\/)/i.test(linkMatch[2]);
				nodes.push(
					safe
						? h('a', { key: key, href: linkMatch[2], target: '_blank', rel: 'noreferrer noopener' }, linkMatch[1] || linkMatch[2])
						: h('span', { key: key }, linkMatch[1] || linkMatch[2])
				);
			} else nodes.push(token);
		}
		last = match.index + token.length;
	}
	if (last < source.length) nodes.push(source.slice(last));
	return nodes;
}

function splitTableRow(line) {
	const trimmed = String(line).trim().replace(/^\|/, '').replace(/\|$/, '');
	const cells = [];
	let current = '';
	for (let i = 0; i < trimmed.length; i += 1) {
		const ch = trimmed.charAt(i);
		if (ch === '\\' && trimmed.charAt(i + 1) === '|') {
			current += '|';
			i += 1;
		} else if (ch === '|') {
			cells.push(current.trim());
			current = '';
		} else current += ch;
	}
	cells.push(current.trim());
	return cells;
}

/* 修复「Markdown 标记全部挤在一行」的模型输出（常见于流式/部分模型）。
 * 仅作用于展示层，不修改服务端已保存文本。 */
DSP.repairCollapsedMarkdown = function repairCollapsedMarkdown(text) {
	const source = String(text == null ? '' : text);
	if (source === '') return source;
	const newlineCount = (source.match(/\n/g) || []).length;
	if (newlineCount >= 3) return source;
	let out = source;
	/* 行内出现的 ## 标题标记：在此处断行并补空格。 */
	out = out.replace(/([^\n#])(#{1,6})(?=[^\s#])/g, '$1\n\n$2 ');
	/* 行首标题标记与文字之间没有空格。 */
	out = out.replace(/^(#{1,6})(?=[^\s#])/gm, '$1 ');
	/* 句末标点后紧跟 **加粗小节**。 */
	out = out.replace(/([。！？；;.!?])\s*(\*\*[^*\n]{1,40}\*\*)/g, '$1\n\n$2');
	/* 句末标点后紧跟 1. 2. 列表项（可无空格）。 */
	out = out.replace(/([。！？；;.!?])\s*(\d{1,2})[.、)]\s*/g, '$1\n$2. ');
	/* 中文/标点后紧跟数字列表项，如「推导1.表达式」。 */
	out = out.replace(/([\u4e00-\u9fff])(\d{1,2})[.、)](?=[\u4e00-\u9fffA-Za-z「『“])/g, '$1\n$2. ');
	/* 句末标点后的 - / * 列表。 */
	out = out.replace(/([。！？；;.!?])\s*[-*]\s+(?=[^\s])/g, '$1\n- ');
	/* 中文/句末标点后紧跟加粗 bullet，如「干扰项-**C.1**」「。-**D**」。 */
	out = out.replace(/([\u4e00-\u9fff。！？；;.!?])\s*[-*]\s*(?=\*\*)/g, '$1\n- ');
	/* 行首数字列表标记缺空格。 */
	out = out.replace(/^(\s*\d{1,2})[.)](?=[^\s])/gm, '$1. ');
	/* 全角/半角逗号、顿号后紧跟数字列表项（如「x=1，2.代入」）。 */
	out = out.replace(/([，,、])\s*(\d{1,2})[.、)](?=[\u4e00-\u9fffA-Za-z])/g, '$1\n$2. ');
	/* 逗号/顿号后紧跟加粗 bullet。 */
	out = out.replace(/([，,、])\s*[-*]\s*(?=\*\*)/g, '$1\n- ');
	return out;
};

/* 行内 Markdown 渲染（用于选项等单行/少行文本）：支持 **粗体**、*斜体*、`代码`、链接与换行，
 * 并保留连续空格（调用方给容器加 white-space:pre-wrap 或使用默认的 dsp-inline-md）。 */
DSP.inlineMarkdown = function inlineMarkdown(text) {
	const source = String(text == null ? '' : text);
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const nodes = [];
	lines.forEach(function (line, lineIndex) {
		if (lineIndex > 0) nodes.push(h('br', { key: 'br-' + lineIndex }));
		renderInline(line, 'inline-' + lineIndex).forEach(function (node) {
			nodes.push(node);
		});
	});
	return h('span', { className: 'dsp-inline-md' }, nodes);
};

DSP.markdown = function markdown(text) {
	const source = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
	const lines = source.split('\n');
	const blocks = [];
	let i = 0;
	let keySeed = 0;
	function nextKey() {
		keySeed += 1;
		return 'md-' + keySeed;
	}
	while (i < lines.length) {
		const line = lines[i];
		const trimmed = line.trim();
		if (trimmed === '') {
			i += 1;
			continue;
		}
		if (/^```/.test(trimmed)) {
			const lang = trimmed.slice(3).trim();
			const codeLines = [];
			i += 1;
			while (i < lines.length && !/^```/.test(lines[i].trim())) {
				codeLines.push(lines[i]);
				i += 1;
			}
			if (i < lines.length) i += 1;
			blocks.push(h('pre', { key: nextKey(), className: 'dsp-md-pre' }, h('code', { className: 'dsp-md-block-code', 'data-lang': lang }, codeLines.join('\n'))));
			continue;
		}
		const heading = /^(#{1,6})\s*(\S.*)$/.exec(trimmed);
		if (heading) {
			blocks.push(h('div', { key: nextKey(), className: 'dsp-md-h dsp-md-h' + heading[1].length }, renderInline(heading[2], 'h' + keySeed)));
			i += 1;
			continue;
		}
		if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
			blocks.push(h('hr', { key: nextKey(), className: 'dsp-md-hr' }));
			i += 1;
			continue;
		}
		if (/^>/.test(trimmed)) {
			const quoteLines = [];
			while (i < lines.length && /^>/.test(lines[i].trim())) {
				quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
				i += 1;
			}
			blocks.push(h('blockquote', { key: nextKey(), className: 'dsp-md-quote' }, DSP.markdown(quoteLines.join('\n'))));
			continue;
		}
		/* 4 空格/Tab 缩进的代码块（LLM 常用来保留代码缩进）。 */
		if (/^(\t| {4})/.test(line) && (i === 0 || lines[i - 1].trim() === '' || blocks.length > 0)) {
			const codeLines = [];
			while (i < lines.length && (lines[i].trim() === '' || /^(\t| {4})/.test(lines[i]))) {
				codeLines.push(lines[i].replace(/^(\t| {4})/, ''));
				i += 1;
			}
			while (codeLines.length > 0 && codeLines[codeLines.length - 1].trim() === '') codeLines.pop();
			if (codeLines.length > 0) {
				blocks.push(h('pre', { key: nextKey(), className: 'dsp-md-pre' }, h('code', { className: 'dsp-md-block-code' }, codeLines.join('\n'))));
				continue;
			}
		}
		if (/^\s*[-*+]\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*[-*+]\s+/, ''));
				i += 1;
			}
			blocks.push(h('ul', { key: nextKey(), className: 'dsp-md-list' }, items.map(function (item, itemIndex) {
				return h('li', { key: 'li' + itemIndex }, renderInline(item, 'li' + keySeed + '-' + itemIndex));
			})));
			continue;
		}
		if (/^\s*\d+[.)]\s+/.test(line)) {
			const items = [];
			while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
				items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ''));
				i += 1;
			}
			blocks.push(h('ol', { key: nextKey(), className: 'dsp-md-list' }, items.map(function (item, itemIndex) {
				return h('li', { key: 'li' + itemIndex }, renderInline(item, 'li' + keySeed + '-' + itemIndex));
			})));
			continue;
		}
		if (trimmed.indexOf('|') >= 0 && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) && lines[i + 1].indexOf('-') >= 0) {
			const header = splitTableRow(trimmed);
			i += 2;
			const rows = [];
			while (i < lines.length && lines[i].trim().indexOf('|') >= 0 && lines[i].trim() !== '') {
				rows.push(splitTableRow(lines[i]));
				i += 1;
			}
			blocks.push(
				h(
					'div',
					{ key: nextKey(), className: 'dsp-md-table-wrap' },
					h(
						'table',
						{ className: 'dsp-md-table' },
						h('thead', null, h('tr', null, header.map(function (cell, cellIndex) {
							return h('th', { key: 'th' + cellIndex }, renderInline(cell, 'th' + keySeed + '-' + cellIndex));
						}))),
						h('tbody', null, rows.map(function (row, rowIndex) {
							return h('tr', { key: 'tr' + rowIndex }, row.map(function (cell, cellIndex) {
								return h('td', { key: 'td' + cellIndex }, renderInline(cell, 'td' + keySeed + '-' + rowIndex + '-' + cellIndex));
							}));
						}))
					)
				)
			);
			continue;
		}
		const paragraph = [];
		while (i < lines.length && lines[i].trim() !== '' && !(paragraph.length > 0 && isBlockStart(lines[i]))) {
			paragraph.push(lines[i]);
			i += 1;
		}
		if (paragraph.length === 0) {
			i += 1;
			continue;
		}
		const paragraphNodes = [];
		paragraph.forEach(function (paragraphLine, lineIndex) {
			const parts = renderInline(paragraphLine, 'p' + keySeed + '-' + lineIndex);
			parts.forEach(function (part) {
				paragraphNodes.push(part);
			});
			if (lineIndex < paragraph.length - 1) paragraphNodes.push(h('br', { key: 'br' + keySeed + '-' + lineIndex }));
		});
		blocks.push(h('p', { key: nextKey(), className: 'dsp-md-p' }, paragraphNodes));
	}
	return blocks;
};

/* 安全地把服务端返回的相对路径转成题图 URL。 */
DSP.assetUrl = function assetUrl(courseId, relPath) {
	if (!relPath) return '';
	const encodedCourse = encodeURIComponent(courseId || '');
	const normalized = String(relPath).replace(/^\/+/, '');
	// figures 的 relPath 可能是数据根相对路径（courses/...）；asset 路由按 path 原样接收。
	const path = normalized.indexOf('courses/') === 0 ? normalized : 'courses/' + encodedCourse + '/assets/' + normalized;
	return 'api/practice/asset?courseId=' + encodedCourse + '&path=' + encodeURIComponent(path);
};

/* ------------------------------------------------------------------ */
/* HTTP 客户端                                                        */
/* ------------------------------------------------------------------ */

function practiceUrl(pathname) {
	return 'api/practice/' + String(pathname).replace(/^\/+/, '');
}

async function readErrorResponse(response) {
	let message = '';
	try {
		const text = await response.text();
		try {
			const parsed = JSON.parse(text);
			message = parsed && (parsed.error || parsed.message) ? parsed.error || parsed.message : '';
		} catch (error) {
			message = text.slice(0, 300);
		}
	} catch (error) {
		message = '';
	}
	return message || '请求失败（HTTP ' + response.status + '）';
}

async function apiRequest(pathname, options) {
	const opts = options || {};
	const init = { method: opts.method || 'GET', headers: Object.assign({}, opts.headers || {}) };
	if (opts.signal) init.signal = opts.signal;
	if (opts.body !== undefined) {
		init.headers['content-type'] = 'application/json';
		init.body = JSON.stringify(opts.body);
	}
	const response = await fetch(practiceUrl(pathname), init);
	if (!response.ok) throw new Error(await readErrorResponse(response));
	const text = await response.text();
	let json = null;
	try {
		json = JSON.parse(text);
	} catch (error) {
		throw new Error('服务返回了无法解析的数据');
	}
	if (json && json.ok === false) throw new Error(json.error || '请求失败');
	return json;
}

function queryString(params) {
	if (!params) return '';
	const pairs = [];
	Object.keys(params).forEach(function (key) {
		const value = params[key];
		if (value === undefined || value === null || value === '') return;
		pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
	});
	return pairs.length > 0 ? '?' + pairs.join('&') : '';
}

function getJson(pathname, params) {
	return apiRequest(pathname + queryString(params));
}

function postJson(pathname, body, options) {
	const merged = Object.assign({ method: 'POST', body: body === undefined ? {} : body }, options || {});
	return apiRequest(pathname, merged);
}

DSP.api = {
	request: apiRequest,
	get: getJson,
	post: postJson,
	url: practiceUrl,
	async bootstrap() {
		const json = await getJson('bootstrap');
		return json.data;
	},
	async set(courseId, setId) {
		const json = await getJson('set', { courseId: courseId, setId: setId });
		return json.data;
	},
	async job(jobId) {
		const json = await getJson('job', { jobId: jobId });
		return json.data;
	},
	assetUrl: DSP.assetUrl,
	chatUrl: practiceUrl('chat'),
	ping() {
		return getJson('ping');
	}
};

/* 读取 SSE 流（fetch Response.body），事件为 data: {json}\n\n。 */
DSP.readSSE = async function readSSE(response, handlers) {
	const onEvent = (handlers && handlers.onEvent) || function () {};
	if (!response.ok) throw new Error(await readErrorResponse(response));
	if (!response.body) throw new Error('当前浏览器不支持流式响应');
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';
	for (;;) {
		const chunk = await reader.read();
		if (chunk.done) break;
		buffer += decoder.decode(chunk.value, { stream: true });
		let boundary = buffer.indexOf('\n\n');
		while (boundary >= 0) {
			const frame = buffer.slice(0, boundary);
			buffer = buffer.slice(boundary + 2);
			const dataLines = frame
				.split('\n')
				.filter(function (line) { return line.indexOf('data:') === 0; })
				.map(function (line) { return line.slice(5).replace(/^\s/, ''); });
			if (dataLines.length > 0) {
				let payload = null;
				try {
					payload = JSON.parse(dataLines.join('\n'));
				} catch (error) {
					payload = null; /* 忽略单帧解析失败，继续读流 */
				}
				if (payload !== null) onEvent(payload);
			}
			boundary = buffer.indexOf('\n\n');
		}
	}
};

/* ------------------------------------------------------------------ */
/* 文件与格式化                                                       */
/* ------------------------------------------------------------------ */

function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	const chunkSize = 0x8000;
	for (let index = 0; index < bytes.length; index += chunkSize) {
		const chunk = bytes.subarray(index, Math.min(index + chunkSize, bytes.length));
		binary += String.fromCharCode.apply(null, chunk);
	}
	return btoa(binary);
}

DSP.fileToBase64 = async function fileToBase64(file) {
	const buffer = await file.arrayBuffer();
	return arrayBufferToBase64(buffer);
};

DSP.fmtPct = function fmtPct(value, digits) {
	const number = Number(value);
	if (!Number.isFinite(number)) return '—';
	const safeDigits = typeof digits === 'number' ? digits : 0;
	return (number * 100).toFixed(safeDigits) + '%';
};

DSP.fmtDuration = function fmtDuration(ms) {
	const totalSeconds = Math.max(0, Math.round((Number(ms) || 0) / 1000));
	if (totalSeconds < 60) return totalSeconds + ' 秒';
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	if (minutes < 60) return minutes + ' 分' + (seconds > 0 ? ' ' + seconds + ' 秒' : '');
	const hours = Math.floor(minutes / 60);
	const restMinutes = minutes % 60;
	return hours + ' 小时' + (restMinutes > 0 ? ' ' + restMinutes + ' 分' : '');
};

DSP.fmtBytes = function fmtBytes(bytes) {
	const size = Number(bytes) || 0;
	if (size < 1024) return size + ' B';
	if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB';
	return (size / 1024 / 1024).toFixed(1) + ' MB';
};

function pad2(number) {
	return number < 10 ? '0' + number : String(number);
}

DSP.fmtDate = function fmtDate(timestamp) {
	if (!timestamp) return '—';
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
};

DSP.fmtDay = function fmtDay(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
};

DSP.fmtShortDate = function fmtShortDate(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '—';
	return pad2(date.getMonth() + 1) + '-' + pad2(date.getDate()) + ' ' + pad2(date.getHours()) + ':' + pad2(date.getMinutes());
};

DSP.uid = function uid(prefix) {
	const random = Math.random().toString(36).slice(2, 8);
	return (prefix || 'id') + '_' + Date.now().toString(36) + random;
};

DSP.clamp = function clamp(value, min, max) {
	return Math.min(max, Math.max(min, Number(value) || 0));
};

/* 精确到秒的计时器 hook，返回 {elapsed}。 */
DSP.useElapsed = function useElapsed(active) {
	const state = React.useState(0);
	const setElapsed = state[1];
	const startRef = React.useRef(0);
	React.useEffect(
		function () {
			if (!active) return undefined;
			startRef.current = Date.now();
			const timer = window.setInterval(function () {
				setElapsed(Math.round((Date.now() - startRef.current) / 1000));
			}, 1000);
			return function () {
				window.clearInterval(timer);
			};
		},
		[active]
	);
	return state[0];
};

DSP.debounce = function debounce(fn, wait) {
	let timer = null;
	return function debounced() {
		const args = arguments;
		if (timer) window.clearTimeout(timer);
		timer = window.setTimeout(function () {
			timer = null;
			fn.apply(null, args);
		}, wait);
	};
};

DSP.copyText = async function copyText(text) {
	try {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			await navigator.clipboard.writeText(String(text));
			return true;
		}
	} catch (error) {
		/* 落到 textarea 方案 */
	}
	const textarea = document.createElement('textarea');
	textarea.value = String(text);
	textarea.setAttribute('readonly', 'readonly');
	textarea.style.position = 'fixed';
	textarea.style.opacity = '0';
	document.body.appendChild(textarea);
	textarea.select();
	let ok = false;
	try {
		ok = document.execCommand('copy');
	} catch (error) {
		ok = false;
	}
	document.body.removeChild(textarea);
	return ok;
};

/* 记录聚合工具（多个片段共用）：同一题多次作答以最新一条为准。 */
DSP.latestRecords = function latestRecords(records) {
	const map = new Map();
	const source = Array.isArray(records) ? records : [];
	source.forEach(function (record) {
		if (!record || !record.questionId) return;
		const key = String(record.setId || '') + '/' + String(record.questionId);
		const previous = map.get(key);
		if (!previous || (Number(record.at) || 0) >= (Number(previous.at) || 0)) map.set(key, record);
	});
	return Array.from(map.values());
};

DSP.accuracyOf = function accuracyOf(records) {
	const judged = (records || []).filter(function (record) { return record && (record.correct === true || record.correct === false); });
	if (judged.length === 0) return null;
	const correct = judged.filter(function (record) { return record.correct === true; }).length;
	return correct / judged.length;
};

/* ==== src/client/20-store.js ==== */
/* 刷题模式 Client — 全局状态与动作（Lead 维护）。
 *
 * 所有 UI 片段都通过 DSP.store / DSP.useStore 读取状态，通过 DSP.store.actions
 * 调用后端。状态变更只走这里的 helper，组件不要自己 fetch bootstrap。
 */

var __storeState = {
	ready: false,
	loading: false,
	initStarted: false,
	error: null,
	data: { courses: [], global: { analysis: null }, capabilities: { images: false, render: false, model: null } },
	setCache: {}, // setId -> { loading, error, data }
	threads: {}, // threadId -> { loading, error, thread: {id,title,messages} }
	chatMessages: {}, // threadId -> [{role,text,at,context,error}]
	ui: {
		view: 'course-home', // course-home | practice | course-dash | global-dash
		courseId: null,
		setId: null,
		questionIndex: 0,
		mode: 'immediate',
		parse: null, // { setId, jobId, status, message, progress, error }
		analysisJob: null, // { scope, jobId, status, message, progress }
		svgJob: null, // { jobId, setId, questionId, figureIndex, status, message }
		chat: {
			threadId: null,
			draft: '',
			attachments: [],
			streaming: false,
			pending: '',
			focusBump: 0,
			expandBump: 0,
			error: null,
			autoAsk: false
		},
		toasts: []
	}
};

var __storeListeners = new Set();

function storeGet() {
	return __storeState;
}

function storeNotify() {
	__storeState = Object.assign({}, __storeState);
	const listeners = Array.from(__storeListeners);
	for (let index = 0; index < listeners.length; index += 1) {
		try {
			listeners[index]();
		} catch (error) {
			/* 单个订阅者异常不影响其他订阅者 */
		}
	}
}

function storePatch(updater) {
	updater(__storeState);
	storeNotify();
}

function setUI(patch) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, patch);
	});
}

function setChatUI(patch) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui);
		state.ui.chat = Object.assign({}, state.ui.chat, patch);
	});
}

function sleep(ms) {
	return new Promise(function (resolve) {
		window.setTimeout(resolve, ms);
	});
}

function currentCourse() {
	const state = __storeState;
	const id = state.ui.courseId;
	if (!id) return null;
	return (state.data.courses || []).find(function (course) {
		return course.id === id;
	}) || null;
}

function currentSetSummary() {
	const course = currentCourse();
	if (!course || !__storeState.ui.setId) return null;
	return (course.sets || []).find(function (set) {
		return set.id === __storeState.ui.setId;
	}) || null;
}

function mutateCourse(courseId, mutator) {
	storePatch(function (state) {
		const courses = (state.data.courses || []).map(function (course) {
			if (course.id !== courseId) return course;
			const copy = Object.assign({}, course);
			mutator(copy);
			return copy;
		});
		state.data = Object.assign({}, state.data, { courses: courses });
	});
}

function pushToast(text, kind) {
	const id = DSP.uid('toast');
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, {
			toasts: (state.ui.toasts || []).concat([{ id: id, text: String(text), kind: kind || 'info' }])
		});
	});
	window.setTimeout(function () {
		storePatch(function (state) {
			state.ui = Object.assign({}, state.ui, {
				toasts: (state.ui.toasts || []).filter(function (toast) {
					return toast.id !== id;
				})
			});
		});
	}, kind === 'error' ? 5200 : 3200);
}

function dismissToast(id) {
	storePatch(function (state) {
		state.ui = Object.assign({}, state.ui, {
			toasts: (state.ui.toasts || []).filter(function (toast) {
				return toast.id !== id;
			})
		});
	});
}

function upsertRecord(list, record) {
	const next = (list || []).slice();
	const index = next.findIndex(function (item) {
		return item.id === record.id;
	});
	if (index >= 0) next[index] = Object.assign({}, next[index], record);
	else next.push(record);
	return next;
}

async function loadBootstrap(keepUI) {
	const previous = __storeState;
	if (!keepUI) setUI({ courseId: previous.ui.courseId, setId: previous.ui.setId });
	storePatch(function (state) {
		state.loading = true;
		state.error = null;
	});
	try {
		const data = await DSP.api.bootstrap();
		storePatch(function (state) {
			state.data = {
				courses: Array.isArray(data.courses) ? data.courses : [],
				global: data.global || { analysis: null },
				capabilities: data.capabilities || { images: false, render: false, model: null }
			};
			state.ready = true;
			state.loading = false;
			state.error = null;
			const courses = state.data.courses;
			let courseId = state.ui.courseId;
			if (!courseId && courses.length > 0) courseId = courses[0].id;
			if (courseId && !courses.some(function (course) { return course.id === courseId; })) courseId = courses.length > 0 ? courses[0].id : null;
			let setId = state.ui.setId;
			const course = courses.find(function (item) { return item.id === courseId; });
			if (course && setId && !(course.sets || []).some(function (set) { return set.id === setId; })) setId = null;
			const view = courseId ? (state.ui.view === 'practice' && !setId ? 'course-home' : state.ui.view) : 'global-dash';
			state.ui = Object.assign({}, state.ui, { courseId: courseId, setId: setId, view: view });
		});
		return __storeState;
	} catch (error) {
		storePatch(function (state) {
			state.loading = false;
			state.error = error && error.message ? error.message : String(error);
		});
		throw error;
	}
}

async function pollJob(jobId, options) {
	const opts = options || {};
	const interval = opts.interval || 900;
	for (;;) {
		const job = await DSP.api.job(jobId);
		if (typeof opts.onUpdate === 'function') opts.onUpdate(job);
		if (!job || job.status !== 'running') return job;
		if (opts.signal && opts.signal.aborted) throw new Error('已取消');
		await sleep(interval);
	}
}

function updateThreadSummary(courseId, threadId, patch) {
	mutateCourse(courseId, function (course) {
		const threads = (course.chatThreads || []).slice();
		const index = threads.findIndex(function (thread) { return thread.id === threadId; });
		if (index >= 0) threads[index] = Object.assign({}, threads[index], patch);
		else threads.unshift(Object.assign({ id: threadId, title: '新对话', createdAt: Date.now(), updatedAt: Date.now(), messageCount: 0 }, patch));
		course.chatThreads = threads;
	});
}

const storeActions = {
	init: async function init() {
		if (__storeState.initStarted) return;
		storePatch(function (state) {
			state.initStarted = true;
		});
		// 首次进入插件默认停在「所有课程看板」（左栏移除后这里是课程/看板统一入口）。
		setUI({ view: 'global-dash' });
		try {
			await loadBootstrap(true);
		} catch (error) {
			/* 错误已进入 state.error，App 展示重试 */
		}
	},
	reload: function reload() {
		return loadBootstrap(true);
	},
	getCourse: currentCourse,
	getSetSummary: currentSetSummary,
	ui: setUI,
	chatUI: setChatUI,
	toast: pushToast,
	dismissToast: dismissToast,

	navigate: function navigate(view, patch) {
		setUI(Object.assign({ view: view }, patch || {}));
	},
	openCourse: function openCourse(courseId) {
		const changed = __storeState.ui.courseId !== courseId;
		setUI({
			view: 'course-home',
			courseId: courseId,
			setId: null,
			questionIndex: 0,
			parse: null,
			svgJob: null
		});
		if (changed) {
			storePatch(function (state) {
				state.ui = Object.assign({}, state.ui);
				state.ui.chat = {
					threadId: null,
					draft: '',
					attachments: [],
					streaming: false,
					pending: '',
					focusBump: 0,
					error: null,
					autoAsk: false
				};
			});
		}
	},
	openPractice: function openPractice(courseId, setId) {
		setUI({ view: 'practice', courseId: courseId, setId: setId, questionIndex: 0, parse: null });
		storeActions.loadSet(courseId, setId).catch(function () {});
	},
	openCourseDash: function openCourseDash(courseId) {
		setUI({ view: 'course-dash', courseId: courseId });
	},
	openGlobalDash: function openGlobalDash() {
		setUI({ view: 'global-dash' });
	},

	createCourse: async function createCourse(input) {
		const json = await DSP.api.post('course', { action: 'create', name: input.name, description: input.description || '' });
		await loadBootstrap(true);
		setUI({ view: 'course-home', courseId: json.courseId, setId: null });
		pushToast(DSP.t('课程已创建'), 'success');
		return json.courseId;
	},
	updateCourse: async function updateCourse(courseId, patch) {
		await DSP.api.post('course', Object.assign({ action: 'update', courseId: courseId }, patch));
		await loadBootstrap(true);
	},
	deleteCourse: async function deleteCourse(courseId) {
		await DSP.api.post('course', { action: 'delete', courseId: courseId });
		const state = __storeState;
		if (state.ui.courseId === courseId) setUI({ courseId: null, setId: null, view: 'course-home' });
		await loadBootstrap(true);
	},
	deleteSet: async function deleteSet(courseId, setId) {
		await DSP.api.post('set/delete', { courseId: courseId, setId: setId });
		if (__storeState.ui.setId === setId) setUI({ setId: null, view: 'course-home' });
		await loadBootstrap(true);
		pushToast('已删除该套题', 'success');
	},

	loadSet: async function loadSet(courseId, setId) {
		const cache = __storeState.setCache[setId];
		if (cache && cache.loading) return cache.promise;
		if (cache && cache.data && cache.courseId === courseId) return cache.data;
		const promise = (async function () {
			storePatch(function (state) {
				state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: true, data: cache && cache.data, courseId: courseId } });
			});
			try {
				const data = await DSP.api.set(courseId, setId);
				storePatch(function (state) {
					state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: false, data: data, courseId: courseId } });
				});
				return data;
			} catch (error) {
				storePatch(function (state) {
					state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: false, error: error.message, courseId: courseId } });
				});
				throw error;
			}
		})();
		storePatch(function (state) {
			state.setCache = Object.assign({}, state.setCache, { [setId]: { loading: true, promise: promise, data: cache && cache.data, courseId: courseId } });
		});
		return promise;
	},
	invalidateSet: function invalidateSet(setId) {
		storePatch(function (state) {
			const next = Object.assign({}, state.setCache);
			delete next[setId];
			state.setCache = next;
		});
	},
	setData: function getSetData(setId) {
		const cache = __storeState.setCache[setId];
		return cache ? cache.data : null;
	},

	filterFiles: function filterFiles(files, mode) {
		const list = Array.from(files || []);
		const allowed = mode === 'question'
			? ['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.png', '.jpg', '.jpeg', '.webp', '.txt', '.md', '.markdown']
			: ['.pdf', '.docx', '.pptx', '.txt', '.md', '.markdown', '.csv', '.json', '.html', '.htm'];
		const accepted = [];
		const skipped = [];
		list.forEach(function (file) {
			const name = file.name || 'file';
			const dot = name.lastIndexOf('.');
			const ext = dot >= 0 ? name.slice(dot).toLowerCase() : '';
			if (allowed.indexOf(ext) < 0) skipped.push({ name: name, reason: '不支持的文件类型' });
			else if (file.size > 25 * 1024 * 1024) skipped.push({ name: name, reason: '文件超过 25MB' });
			else accepted.push(file);
		});
		return { accepted: accepted, skipped: skipped };
	},

	uploadDocs: async function uploadDocs(courseId, files) {
		const { accepted, skipped } = storeActions.filterFiles(files, 'doc');
		const uploaded = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const data = await DSP.fileToBase64(file);
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			const json = await DSP.api.post('upload', {
				courseId: courseId,
				category: 'doc',
				files: [{ name: file.name, path: relative, data: data }]
			});
			uploaded.push.apply(uploaded, json.docs || []);
			skipped.push.apply(skipped, json.skipped || []);
		}
		await loadBootstrap(true);
		if (uploaded.length > 0) pushToast('已上传 ' + uploaded.length + ' 个课程文档', 'success');
		if (skipped.length > 0) pushToast('已跳过 ' + skipped.length + ' 个文件', 'warn');
		return { docs: uploaded, skipped: skipped };
	},
	deleteDoc: async function deleteDoc(courseId, docId) {
		await DSP.api.post('doc/delete', { courseId: courseId, docId: docId });
		await loadBootstrap(true);
		pushToast('已删除文档', 'success');
	},

	uploadQuestions: async function uploadQuestions(courseId, files) {
		const { accepted, skipped } = storeActions.filterFiles(files, 'question');
		if (accepted.length === 0) throw new Error('没有可上传的题目文件');
		const payload = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file) });
		}
		const json = await DSP.api.post('upload', { courseId: courseId, category: 'question', files: payload });
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (json.setId) {
			setUI({ courseId: courseId, setId: json.setId, view: 'practice', questionIndex: 0 });
			await storeActions.startParse(courseId, json.setId);
		}
		return { setId: json.setId, skipped: skipped };
	},

	/** 上传试卷并可选同时上传答案文件，然后只解析一次（上传流程统一入口）。 */
	uploadExamSet: async function uploadExamSet(courseId, questionFiles, answerFiles) {
		const questionPick = storeActions.filterFiles(questionFiles, 'question');
		if (questionPick.accepted.length === 0) throw new Error('没有可上传的题目文件');
		const skipped = questionPick.skipped.slice();
		const payload = [];
		for (let index = 0; index < questionPick.accepted.length; index += 1) {
			const file = questionPick.accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file) });
		}
		const json = await DSP.api.post('upload', { courseId: courseId, category: 'question', files: payload });
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (!json.setId) return { setId: null, skipped: skipped };
		if (Array.isArray(answerFiles) && answerFiles.length > 0) {
			try {
				await storeActions.uploadAnswerFiles(courseId, json.setId, answerFiles, { silent: true });
			} catch (error) {
				pushToast('答案文件上传失败：' + (error && error.message ? error.message : String(error)), 'warn');
			}
		}
		setUI({ courseId: courseId, setId: json.setId, view: 'practice', questionIndex: 0 });
		await storeActions.startParse(courseId, json.setId);
		return { setId: json.setId, skipped: skipped };
	},

	uploadAnswerFiles: async function uploadAnswerFiles(courseId, setId, files, options) {
		const silent = Boolean(options && options.silent);
		const { accepted, skipped } = storeActions.filterFiles(files, 'question');
		if (accepted.length === 0) throw new Error('没有可上传的答案文件');
		const payload = [];
		for (let index = 0; index < accepted.length; index += 1) {
			const file = accepted[index];
			const relative = file.__dspRelativePath || file.webkitRelativePath || file.name;
			payload.push({ name: file.name, path: relative, data: await DSP.fileToBase64(file), role: 'answers' });
		}
		const json = await DSP.api.post('upload', {
			courseId: courseId,
			category: 'question',
			setId: setId,
			role: 'answers',
			files: payload
		});
		await loadBootstrap(true);
		if ((json.skipped || []).length > 0) skipped.push.apply(skipped, json.skipped);
		if (!silent) {
			pushToast('已上传 ' + payload.length + ' 个答案文件，重新解析后生效', 'success');
			if (skipped.length > 0) pushToast('已跳过 ' + skipped.length + ' 个文件', 'warn');
		}
		return { files: json.files || [], skipped: skipped };
	},
	setAiAnswerMode: async function setAiAnswerMode(courseId, setId, mode) {
		const allowed = ['auto', 'off', 'regenerate'];
		if (allowed.indexOf(mode) < 0) throw new Error('无效的 AI 答案解析模式');
		await DSP.api.post('set/ai-mode', { courseId: courseId, setId: setId, aiAnswerMode: mode });
		mutateCourse(courseId, function (course) {
			course.sets = (course.sets || []).map(function (set) {
				if (set.id !== setId) return set;
				return Object.assign({}, set, { aiAnswerMode: mode, updatedAt: Date.now() });
			});
		});
		pushToast('已保存答案解析设置，重新解析后生效', 'success');
	},

	startParse: async function startParse(courseId, setId) {
		setUI({ parse: { setId: setId, jobId: null, status: 'running', message: DSP.t('正在解析'), progress: 0 } });
		try {
			const json = await DSP.api.post('parse', { courseId: courseId, setId: setId });
			setUI({ parse: { setId: setId, jobId: json.jobId, status: 'running', message: DSP.t('正在解析'), progress: 3 } });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ parse: { setId: setId, jobId: json.jobId, status: update.status, message: update.message || '', progress: update.progress || 0 } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '解析失败');
			await loadBootstrap(true);
			storeActions.invalidateSet(setId);
			await storeActions.loadSet(courseId, setId);
			setUI({ parse: null, view: 'practice', courseId: courseId, setId: setId, questionIndex: 0 });
			pushToast(DSP.t('题目已解析') + '，参考答案后台解析中', 'success');
			/* 参考答案在后台任务里解析：题目先可作答，完成后静默刷新本套题。 */
			const answersJobId = job.result && job.result.answersJobId;
			if (answersJobId) {
				pollJob(answersJobId)
					.then(async function (answersJob) {
						if (!answersJob || answersJob.status !== 'done') {
							if (answersJob && answersJob.error && answersJob.error !== '任务已取消') {
								pushToast('参考答案解析失败：' + answersJob.error, 'warn');
							}
							return;
						}
						await loadBootstrap(true);
						storeActions.invalidateSet(setId);
						await storeActions.loadSet(courseId, setId);
						pushToast('参考答案已更新', 'success');
					})
					.catch(function () {
						/* 后台答案刷新失败不打断答题 */
					});
			}
		} catch (error) {
			setUI({ parse: { setId: setId, status: 'error', message: error.message, progress: 100, error: error.message } });
			await loadBootstrap(true).catch(function () {});
			throw error;
		}
	},

	pollJob: pollJob,

	saveRecords: async function saveRecords(courseId, setId, records) {
		if (!records || records.length === 0) return;
		await DSP.api.post('answers', { courseId: courseId, setId: setId, records: records });
		storePatch(function (state) {
			const courses = (state.data.courses || []).map(function (course) {
				if (course.id !== courseId) return course;
				let list = course.records || [];
				records.forEach(function (record) {
					list = upsertRecord(list, Object.assign({ setId: setId }, record));
				});
				const answered = new Set(list.filter(function (record) { return record.setId === setId; }).map(function (record) { return record.questionId; }));
				return Object.assign({}, course, {
					records: list,
					sets: (course.sets || []).map(function (set) {
						if (set.id !== setId) return set;
						return Object.assign({}, set, { answeredCount: answered.size, updatedAt: Date.now() });
					})
				});
			});
			state.data = Object.assign({}, state.data, { courses: courses });
		});
	},
	setMode: async function setMode(courseId, setId, mode) {
		setUI({ mode: mode });
		mutateCourse(courseId, function (course) {
			course.sets = (course.sets || []).map(function (set) {
				if (set.id !== setId) return set;
				return Object.assign({}, set, { mode: mode });
			});
		});
		await DSP.api.post('set/mode', { courseId: courseId, setId: setId, mode: mode });
	},
	completeSet: async function completeSet(courseId, setId) {
		const json = await DSP.api.post('set/complete', { courseId: courseId, setId: setId });
		await loadBootstrap(true);
		storeActions.invalidateSet(setId);
		return json.summary;
	},

	/** AI 判题：对某题的用户答案生成判定与建议（结果由调用方展示，并可随 record 持久化）。 */
	gradeQuestion: async function gradeQuestion(questionId, userAnswer) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		const setId = state.ui.setId;
		if (!courseId || !setId) throw new Error('请先进入一套题目');
		const json = await DSP.api.post('grade', {
			courseId: courseId,
			setId: setId,
			questionId: questionId,
			userAnswer: Array.isArray(userAnswer) ? userAnswer : (userAnswer === undefined || userAnswer === null ? [] : [String(userAnswer)])
		});
		const job = await pollJob(json.jobId, { interval: 900 });
		if (job.status === 'error') throw new Error(job.error || 'AI 判题失败');
		const result = job.result && typeof job.result === 'object' ? job.result : {};
		return Object.assign({ generatedAt: Date.now() }, result);
	},

	diagnose: async function diagnose(scope, setId) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		if (!courseId && scope !== 'global') throw new Error('请先选择课程');
		if (scope === 'global' && (state.data.courses || []).length === 0) throw new Error('还没有任何课程');
		setUI({ analysisJob: { scope: scope, setId: setId || null, status: 'running', message: DSP.t('正在生成'), progress: 0 } });
		try {
			const json = await DSP.api.post('diagnose', { courseId: courseId || undefined, scope: scope, setId: setId });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ analysisJob: { scope: scope, setId: setId || null, status: update.status, message: update.message || '', progress: update.progress || 0 } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '生成失败');
			await loadBootstrap(true);
			setUI({ analysisJob: null });
			return job.result && job.result.markdown ? job.result.markdown : '';
		} catch (error) {
			setUI({ analysisJob: null });
			throw error;
		}
	},

	redrawFigure: async function redrawFigure(setId, questionId, figureIndex) {
		const state = __storeState;
		const courseId = state.ui.courseId;
		setUI({ svgJob: { jobId: null, setId: setId, questionId: questionId, figureIndex: figureIndex, status: 'running', message: DSP.t('正在生成') } });
		try {
			const json = await DSP.api.post('svg', { courseId: courseId, setId: setId, questionId: questionId, figureIndex: figureIndex });
			const job = await pollJob(json.jobId, {
				onUpdate: function (update) {
					setUI({ svgJob: { jobId: json.jobId, setId: setId, questionId: questionId, figureIndex: figureIndex, status: update.status, message: update.message || '' } });
				}
			});
			if (job.status === 'error') throw new Error(job.error || '重绘失败');
			storeActions.invalidateSet(setId);
			await storeActions.loadSet(courseId, setId);
			setUI({ svgJob: null });
			pushToast('已重新绘制图示', 'success');
		} catch (error) {
			setUI({ svgJob: null });
			throw error;
		}
	},

	loadThread: async function loadThread(courseId, threadId) {
		if (!threadId) return null;
		const existing = __storeState.threads[threadId];
		if (existing && (existing.loading || existing.thread)) return existing.thread || null;
		storePatch(function (state) {
			state.threads = Object.assign({}, state.threads, { [threadId]: { loading: true } });
		});
		try {
			const json = await DSP.api.get('thread', { courseId: courseId, threadId: threadId });
			const thread = json.data;
			storePatch(function (state) {
				state.threads = Object.assign({}, state.threads, { [threadId]: { loading: false, thread: thread } });
				state.chatMessages = Object.assign({}, state.chatMessages, { [threadId]: (thread.messages || []).slice() });
			});
			return thread;
		} catch (error) {
			storePatch(function (state) {
				state.threads = Object.assign({}, state.threads, { [threadId]: { loading: false, error: error.message } });
			});
			return null;
		}
	},
	selectThread: async function selectThread(threadId) {
		const courseId = __storeState.ui.courseId;
		setChatUI({ threadId: threadId, pending: '', error: null });
		if (threadId && courseId) await storeActions.loadThread(courseId, threadId);
	},
	newChat: function newChat() {
		setChatUI({ threadId: null, pending: '', error: null, attachments: [], draft: '' });
	},
	clearChat: async function clearChat() {
		const courseId = __storeState.ui.courseId;
		const threadId = __storeState.ui.chat.threadId;
		if (!courseId) return;
		await DSP.api.post('chat/clear', { courseId: courseId, threadId: threadId || undefined });
		if (threadId) {
			storePatch(function (state) {
				const nextMessages = Object.assign({}, state.chatMessages);
				delete nextMessages[threadId];
				const nextThreads = Object.assign({}, state.threads);
				delete nextThreads[threadId];
				state.chatMessages = nextMessages;
				state.threads = nextThreads;
			});
		}
		await loadBootstrap(true);
		setChatUI({ threadId: null, pending: '', error: null });
	},
	setDraft: function setDraft(text) {
		setChatUI({ draft: text });
	},
	attachToChat: function attachToChat(payload) {
		const text = payload && payload.text ? String(payload.text).trim() : '';
		if (!text) return;
		const attachment = {
			id: DSP.uid('att'),
			type: 'selection',
			text: text,
			label: payload && payload.label ? payload.label : DSP.t('选中文字')
		};
		setChatUI({
			attachments: (__storeState.ui.chat.attachments || []).filter(function (item) {
				return item.type !== 'selection';
			}).concat([attachment]),
			focusBump: (__storeState.ui.chat.focusBump || 0) + 1,
			expandBump: (__storeState.ui.chat.expandBump || 0) + 1
		});
		pushToast(DSP.t('已附加到右侧对话'), 'success');
	},
	removeAttachment: function removeAttachment(id) {
		setChatUI({ attachments: (__storeState.ui.chat.attachments || []).filter(function (item) { return item.id !== id; }) });
	},
	focusChat: function focusChat() {
		setChatUI({ focusBump: (__storeState.ui.chat.focusBump || 0) + 1 });
	},
	askQuestion: function askQuestion(question) {
		if (!question) return;
		const state = __storeState;
		const courseId = state.ui.courseId;
		const setId = state.ui.setId;
		if (!courseId || !setId) return;
		const number = question.number || '';
		const attachment = {
			id: DSP.uid('att'),
			type: 'question',
			questionId: question.id,
			setId: setId,
			number: number,
			stem: question.stem || '',
			label: '第 ' + number + ' 题'
		};
		setChatUI({
			attachments: (state.ui.chat.attachments || []).filter(function (item) { return item.type !== 'question'; }).concat([attachment]),
			focusBump: (state.ui.chat.focusBump || 0) + 1,
			/* 收起状态下点「一键提问」时应先展开对话区 */
			expandBump: (state.ui.chat.expandBump || 0) + 1
		});
		const text = '请详细讲解第 ' + number + ' 题：解题思路、考点、易错点，并结合我的回答说明。';
		return storeActions.chatSend(text, { questionId: question.id, setId: setId, auto: true });
	},

	chatSend: async function chatSend(rawText, opts) {
		const options = opts || {};
		const state = __storeState;
		const courseId = state.ui.courseId;
		const text = String(rawText || '').trim();
		if (!courseId) {
			pushToast('请先选择课程', 'warn');
			return;
		}
		if (state.ui.chat.streaming) {
			pushToast('上一轮回答仍在生成，请稍候', 'warn');
			return;
		}
		if (!text) return;
		const attachments = state.ui.chat.attachments || [];
		const questionAttachment = attachments.find(function (item) { return item.type === 'question'; });
		const selectionAttachment = attachments.find(function (item) { return item.type === 'selection'; });
		const questionId = options.questionId || (questionAttachment ? questionAttachment.questionId : undefined);
		const setId = options.setId || (questionAttachment ? questionAttachment.setId : state.ui.setId);
		const selectedText = options.selectedText || (selectionAttachment ? selectionAttachment.text : '');
		const requestedThread = options.newThread ? null : state.ui.chat.threadId;
		const tempKey = requestedThread || '__new__';
		const userMessage = {
			role: 'user',
			text: text,
			at: Date.now(),
			context: { questionId: questionId || null, selectedText: selectedText || '', attachments: attachments.map(function (item) { return { type: item.type, label: item.label, text: item.text }; }) }
		};
		const priorMessages = (state.chatMessages[tempKey] || []).slice();
		const previousDraft = state.ui.chat.draft;
		const previousAttachments = attachments;
		storePatch(function (patchState) {
			patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [tempKey]: priorMessages.concat([userMessage]) });
			patchState.ui = Object.assign({}, patchState.ui);
			patchState.ui.chat = Object.assign({}, patchState.ui.chat, {
				streaming: true,
				pending: '',
				error: null,
				draft: '',
				attachments: [],
				threadId: requestedThread || patchState.ui.chat.threadId
			});
		});
		let realThreadId = requestedThread || null;
		try {
			const response = await fetch(DSP.api.chatUrl, {
				method: 'POST',
				headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
				body: JSON.stringify({
					courseId: courseId,
					threadId: requestedThread || undefined,
					message: {
						text: text,
						questionId: questionId || undefined,
						setId: setId || undefined,
						selectedText: selectedText || undefined
					}
				})
			});
			await DSP.readSSE(response, {
				onEvent: function (event) {
					if (!event || typeof event.type !== 'string') return;
					if (event.type === 'meta' && event.threadId) {
						realThreadId = event.threadId;
						storePatch(function (patchState) {
							const messages = (patchState.chatMessages[tempKey] || []).slice();
							const next = Object.assign({}, patchState.chatMessages);
							delete next[tempKey];
							next[realThreadId] = messages;
							patchState.chatMessages = next;
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { threadId: realThreadId });
						});
					} else if (event.type === 'delta') {
						storePatch(function (patchState) {
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { pending: (patchState.ui.chat.pending || '') + (event.text || '') });
						});
					} else if (event.type === 'done') {
						const reply = event.message || { role: 'assistant', text: '', at: Date.now(), refs: [] };
						storePatch(function (patchState) {
							const key = realThreadId || tempKey;
							const messages = (patchState.chatMessages[key] || []).slice();
							messages.push(reply);
							patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [key]: messages });
							patchState.ui = Object.assign({}, patchState.ui);
							patchState.ui.chat = Object.assign({}, patchState.ui.chat, { streaming: false, pending: '', threadId: realThreadId || patchState.ui.chat.threadId });
						});
						if (realThreadId) updateThreadSummary(courseId, realThreadId, { updatedAt: Date.now(), messageCount: ((__storeState.chatMessages[realThreadId] || []).length) });
					} else if (event.type === 'error') {
						throw new Error(event.error || '回答失败');
					}
				}
			});
			if (__storeState.ui.chat.streaming) setChatUI({ streaming: false, pending: '' });
		} catch (error) {
			const message = error && error.message ? error.message : String(error);
			const key = realThreadId || tempKey;
			storePatch(function (patchState) {
				const messages = (patchState.chatMessages[key] || []).slice();
				messages.push({ role: 'assistant', text: '（回答失败：' + message + '）', at: Date.now(), error: true });
				patchState.chatMessages = Object.assign({}, patchState.chatMessages, { [key]: messages });
				patchState.ui = Object.assign({}, patchState.ui);
				patchState.ui.chat = Object.assign({}, patchState.ui.chat, { streaming: false, pending: '', error: message, draft: previousDraft, attachments: previousAttachments });
			});
			pushToast(message, 'error');
		}
	}
};

DSP.store = {
	get: storeGet,
	subscribe: function subscribe(listener) {
		__storeListeners.add(listener);
		return function () {
			__storeListeners.delete(listener);
		};
	},
	actions: storeActions
};

DSP.useStore = function useStore(selector) {
	const bumpState = React.useState(0);
	const bump = bumpState[1];
	React.useEffect(function () {
		return DSP.store.subscribe(function () {
			bump(function (value) {
				return value + 1;
			});
		});
	}, []);
	const state = storeGet();
	return selector ? selector(state) : state;
};

DSP.useCourse = function useCourse() {
	return DSP.useStore(function (state) {
		const id = state.ui.courseId;
		return (state.data.courses || []).find(function (course) { return course.id === id; }) || null;
	});
};

/* ==== src/client/30-rail.js ==== */
/* 刷题模式 Client — 左课程栏 + 课程创建/编辑弹窗（course-ui-dev）。
 * 只读 DSP.store 并调用 store.actions；不直接 fetch。
 * 导出：DSP.Rail、DSP.CourseCreateModal。
 */

function railCourseAccuracy(course) {
	return DSP.accuracyOf(DSP.latestRecords(course && course.records ? course.records : []));
}

/* 任务进度兼容：0~1 视为比例，>1 视为百分数（Host jobs 的 progress 为百分数）。 */
function courseUiProgressFraction(progress) {
	const number = Number(progress);
	if (!Number.isFinite(number) || number <= 0) return 0;
	if (number <= 1) return number;
	return Math.min(1, number / 100);
}

function railCourseMeta(course) {
	const sets = course && course.sets ? course.sets : [];
	const accuracy = railCourseAccuracy(course);
	return sets.length + ' ' + DSP.t('套') + ' · ' + (accuracy === null ? '—' : DSP.fmtPct(accuracy));
}

function RailCourseButton(props) {
	const course = props.course;
	const active = props.active;
	return h(
		'button',
		{
			type: 'button',
			className: 'dsp-rail-course' + (active ? ' dsp-rail-course-active' : ''),
			title: course.name || DSP.t('未命名课程'),
			'aria-current': active ? 'page' : undefined,
			onClick: function () {
				DSP.store.actions.openCourse(course.id);
			}
		},
		h('span', { className: 'dsp-rail-course-name' }, course.name || DSP.t('未命名课程')),
		h('span', { className: 'dsp-rail-course-meta' }, railCourseMeta(course))
	);
}

/* 左栏：新建课程按钮 + 课程列表（可滚动） + 底部全局看板入口。 */
function Rail() {
	const storeState = DSP.useStore(function (state) {
		return {
			courses: state.data.courses || [],
			view: state.ui.view,
			courseId: state.ui.courseId,
			loading: state.loading
		};
	});
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const courses = storeState.courses || [];
	return h(
		'aside',
		{ className: 'dsp-rail', 'aria-label': DSP.t('刷题模式') },
		h('div', { className: 'dsp-rail-new' },
			h(
				DSP.Btn,
				{
					variant: 'primary',
					icon: 'plus',
					block: true,
					onClick: function () {
						setCreating(true);
					}
				},
				DSP.t('新建课程')
			)
		),
		h(
			'div',
			{ className: 'dsp-rail-scroll' },
			h(
				'div',
				{ className: 'dsp-rail-section' },
				h('span', { className: 'dsp-rail-section-title' }, DSP.t('所有课程')),
				courses.length > 0 ? h('span', { className: 'dsp-rail-section-count' }, String(courses.length)) : null
			),
			courses.length === 0
				? h(
						'div',
						{ className: 'dsp-rail-empty' },
						h('div', { className: 'dsp-rail-empty-title' }, storeState.loading ? DSP.t('正在加载…') : DSP.t('暂无课程'))
					)
				: h(
						'div',
						{ className: 'dsp-rail-list' },
						courses.map(function (course) {
							return h(RailCourseButton, {
								key: course.id,
								course: course,
								active: storeState.view !== 'global-dash' && course.id === storeState.courseId
							});
						})
					)
		),
		h(
			'div',
			{ className: 'dsp-rail-foot' },
			h(
				DSP.Btn,
				{
					variant: 'secondary',
					icon: 'chart',
					block: true,
					className: storeState.view === 'global-dash' ? 'dsp-rail-global-active' : '',
					onClick: function () {
						DSP.store.actions.openGlobalDash();
					}
				},
				DSP.t('所有课程看板')
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

/* 新建 / 编辑课程弹窗：props { course?, onClose }。Esc 由 DSP.Modal 统一处理。 */
function CourseCreateModal(props) {
	const options = props || {};
	const editing = Boolean(options.course && options.course.id);
	const nameState = React.useState(editing ? String(options.course.name || '') : '');
	const name = nameState[0];
	const setName = nameState[1];
	const descriptionState = React.useState(editing ? String(options.course.description || '') : '');
	const description = descriptionState[0];
	const setDescription = descriptionState[1];
	const savingState = React.useState(false);
	const saving = savingState[0];
	const setSaving = savingState[1];
	const errorState = React.useState(null);
	const error = errorState[0];
	const setError = errorState[1];
	const nameRef = React.useRef(null);
	const composingState = React.useState(false);
	const composing = composingState[0];
	const setComposing = composingState[1];

	React.useEffect(function () {
		const element = nameRef.current;
		if (!element) return;
		element.focus();
		if (editing) element.select();
	}, []);

	function close() {
		if (typeof options.onClose === 'function') options.onClose();
	}

	function submit() {
		if (saving) return;
		const trimmed = String(name || '').trim();
		if (!trimmed) {
			setError(DSP.t('请输入课程名称'));
			return;
		}
		setSaving(true);
		setError(null);
		const payload = { name: trimmed, description: String(description || '').trim() };
		const request = editing ? DSP.store.actions.updateCourse(options.course.id, payload) : DSP.store.actions.createCourse(payload);
		Promise.resolve(request)
			.then(function () {
				close();
			})
			.catch(function (failure) {
				setSaving(false);
				setError(failure && failure.message ? failure.message : String(failure));
			});
	}

	function onNameKeyDown(event) {
		const nativeEvent = event.nativeEvent || {};
		/* 输入法候选词组合中：Enter 用于确认候选词，不提交表单。 */
		if (composing || nativeEvent.isComposing || nativeEvent.keyCode === 229) return;
		if (event.key === 'Enter') {
			event.preventDefault();
			submit();
		}
	}

	return h(
		DSP.Modal,
		{
			open: true,
			title: editing ? DSP.t('编辑课程') : DSP.t('新建课程'),
			onClose: close,
			footer: [
				h(DSP.Btn, { key: 'cancel', variant: 'ghost', onClick: close, disabled: saving }, DSP.t('取消')),
				h(
					DSP.Btn,
					{ key: 'save', variant: 'primary', icon: 'check', loading: saving, disabled: saving, onClick: submit },
					editing ? DSP.t('保存') : DSP.t('新建课程')
				)
			]
		},
		h(
			'div',
			{ className: 'dsp-col dsp-gap-12' },
			h(
				DSP.Field,
				{ label: DSP.t('课程名称') },
				h('input', {
					ref: nameRef,
					className: 'dsp-input',
					type: 'text',
					value: name,
					maxLength: 80,
					placeholder: DSP.t('例如：高等数学'),
					disabled: saving,
					'aria-invalid': Boolean(error) && !String(name || '').trim(),
					onChange: function (event) {
						setName(event.target.value);
					},
					onCompositionStart: function () {
						setComposing(true);
					},
					onCompositionEnd: function () {
						setComposing(false);
					},
					onKeyDown: onNameKeyDown
				})
			),
			h(
				DSP.Field,
				{ label: DSP.t('课程简介'), optional: true },
				h('textarea', {
					className: 'dsp-textarea',
					rows: 3,
					value: description,
					maxLength: 400,
					placeholder: DSP.t('这门课程的学习范围、目标或备注（可选）'),
					disabled: saving,
					onChange: function (event) {
						setDescription(event.target.value);
					}
				})
			),
			error ? h('div', { className: 'dsp-field-error', role: 'alert' }, error) : null
		)
	);
}

DSP.Rail = Rail;
DSP.CourseCreateModal = CourseCreateModal;

/* ==== src/client/31-course-home.js ==== */
/* 刷题模式 Client — 课程主页（course-ui-dev）。
 * 课程概览 + 题目集（上传/解析/练习/删除） + 课程文档（上传文件/文件夹/删除）。
 * 数据全部来自 DSP.store；上传与解析走 store.actions。
 */

const COURSE_HOME_QUESTION_ACCEPT = '.pdf,.docx,.doc,.pptx,.ppt,.png,.jpg,.jpeg,.webp,.txt,.md,.markdown';
const COURSE_HOME_DOC_ACCEPT = '.pdf,.docx,.pptx,.txt,.md,.markdown,.csv,.json,.html,.htm';
const COURSE_HOME_IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

/* 课程文档折叠状态：按课程持久化到 localStorage，默认收起。 */
const COURSE_HOME_DOCS_OPEN_PREFIX = 'practice-mode.docs-open.';

function courseHomeStorageGet(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return null;
		return window.localStorage.getItem(key);
	} catch (error) {
		return null;
	}
}

function courseHomeStorageSet(key, value) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.setItem(key, value);
	} catch (error) {
		/* 隐私模式/配额不足时忽略 */
	}
}

function courseHomeReadDocsOpen(courseId) {
	if (!courseId) return false;
	return courseHomeStorageGet(COURSE_HOME_DOCS_OPEN_PREFIX + courseId) === '1';
}

function courseHomeWriteDocsOpen(courseId, open) {
	if (!courseId) return;
	courseHomeStorageSet(COURSE_HOME_DOCS_OPEN_PREFIX + courseId, open ? '1' : '0');
}

function courseHomeErrorText(error) {
	if (!error) return DSP.t('操作失败');
	return error.message ? String(error.message) : String(error);
}

/* 仅当拖拽内容包含文件时才走上传逻辑，避免干扰文本拖拽（拖选文字等）默认行为。 */
function courseHomeIsFileDrag(event) {
	const dataTransfer = event && event.dataTransfer;
	if (!dataTransfer || !dataTransfer.types) return false;
	return Array.from(dataTransfer.types || []).indexOf('Files') >= 0;
}

const COURSE_HOME_DRAG_FILE_LIMIT = 300;

/* 拖拽 DataTransferItem → FileSystemEntry；不支持 webkitGetAsEntry 的浏览器返回空数组。 */
function courseHomeDropEntries(dataTransfer) {
	const entries = [];
	if (!dataTransfer || !dataTransfer.items || typeof dataTransfer.items.length !== 'number') return entries;
	for (let index = 0; index < dataTransfer.items.length; index += 1) {
		const item = dataTransfer.items[index];
		if (!item || item.kind !== 'file') continue;
		try {
			const entry = typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null;
			if (entry) entries.push(entry);
		} catch (error) {
			/* 单个条目读取失败不影响其它条目 */
		}
	}
	return entries;
}

/* 递归读取一个 FileSystemEntry；state = { files: File[], truncated: boolean }。 */
function courseHomeReadEntry(entry, prefix, state) {
	return new Promise(function (resolve, reject) {
		if (!entry) {
			resolve();
			return;
		}
		if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
			state.truncated = true;
			resolve();
			return;
		}
		if (entry.isFile) {
			entry.file(
				function (file) {
					if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
						state.truncated = true;
						resolve();
						return;
					}
					try {
						/* store.upload* 会优先使用该字段作为上传相对路径。 */
						file.__dspRelativePath = prefix ? prefix + file.name : file.name;
					} catch (error) {
						/* File 只读时忽略，store 会回退 webkitRelativePath / name */
					}
					state.files.push(file);
					resolve();
				},
				function (error) {
					reject(error || new Error('读取文件失败'));
				}
			);
			return;
		}
		if (!entry.isDirectory) {
			resolve();
			return;
		}
		const reader = entry.createReader();
		const dirPrefix = prefix + (entry.name || '') + '/';
		function readNextBatch() {
			reader.readEntries(
				function (entries) {
					/* readEntries 每次返回一批，必须循环到返回空数组为止。 */
					if (!entries || entries.length === 0) {
						resolve();
						return;
					}
					let index = 0;
					function next() {
						if (state.files.length >= COURSE_HOME_DRAG_FILE_LIMIT) {
							state.truncated = true;
							resolve();
							return;
						}
						if (index >= entries.length) {
							readNextBatch();
							return;
						}
						const child = entries[index];
						index += 1;
						courseHomeReadEntry(child, dirPrefix, state).then(next, reject);
					}
					next();
				},
				function (error) {
					reject(error || new Error('读取文件夹失败'));
				}
			);
		}
		readNextBatch();
	});
}

/* 读取拖入的顶层 entries（文件/文件夹混合），返回 { files, truncated }。 */
function courseHomeReadDroppedEntries(entries) {
	return new Promise(function (resolve, reject) {
		const state = { files: [], truncated: false };
		let index = 0;
		function nextEntry() {
			if (index >= entries.length) {
				resolve(state);
				return;
			}
			const entry = entries[index];
			index += 1;
			courseHomeReadEntry(entry, '', state).then(nextEntry, reject);
		}
		nextEntry();
	});
}

/* 非文件夹环境兜底：直接使用 dataTransfer.files，并统一写 __dspRelativePath。 */
function courseHomeFilesFromDataTransfer(dataTransfer) {
	const files = [];
	const list = dataTransfer && dataTransfer.files ? dataTransfer.files : [];
	for (let index = 0; index < list.length; index += 1) {
		const file = list[index];
		if (!file) continue;
		try {
			file.__dspRelativePath = file.__dspRelativePath || file.webkitRelativePath || file.name;
		} catch (error) {
			/* ignore */
		}
		files.push(file);
	}
	return files;
}

/* 文档相对路径：优先 Host 的 relativePath；旧数据从 relPath 提取；最后回退 doc.name。 */
function courseHomeDocRelativePath(doc) {
	if (!doc) return '';
	if (typeof doc.relativePath === 'string' && doc.relativePath) return doc.relativePath;
	const relPath = typeof doc.relPath === 'string' ? doc.relPath : '';
	if (relPath) {
		const matched = /^courses\/[^/]+\/docs\/[^/]+\/(.*)$/.exec(relPath);
		if (matched && matched[1]) return matched[1];
	}
	return doc.name || '';
}

function courseHomeDocFileName(doc, relativePath) {
	const path = typeof relativePath === 'string' && relativePath ? relativePath : courseHomeDocRelativePath(doc);
	const slash = path.lastIndexOf('/');
	const name = slash >= 0 ? path.slice(slash + 1) : path;
	return name || (doc && doc.name) || DSP.t('未命名文档');
}

/* 按目录分组：分组头为目录路径（根目录为空串），组内按文件名排序。 */
function courseHomeDocGroups(docs) {
	const groups = [];
	const index = new Map();
	(docs || []).forEach(function (doc) {
		const relativePath = courseHomeDocRelativePath(doc);
		const slash = relativePath.lastIndexOf('/');
		const dir = slash >= 0 ? relativePath.slice(0, slash) : '';
		let group = index.get(dir);
		if (!group) {
			group = { path: dir, docs: [] };
			index.set(dir, group);
			groups.push(group);
		}
		group.docs.push({ doc: doc, fileName: courseHomeDocFileName(doc, relativePath) });
	});
	groups.sort(function (left, right) {
		if (left.path === right.path) return 0;
		if (left.path === '') return -1;
		if (right.path === '') return 1;
		return left.path.localeCompare(right.path);
	});
	groups.forEach(function (group) {
		group.docs.sort(function (left, right) {
			return left.fileName.localeCompare(right.fileName);
		});
	});
	return groups;
}

function courseHomeSetStatus(set) {
	const status = set && set.status;
	if (status === 'parsing') return { label: DSP.t('正在解析'), tone: 'brand' };
	if (status === 'failed') return { label: DSP.t('解析失败'), tone: 'error' };
	if (status === 'ready') {
		if (set.completedAt) return { label: DSP.t('已完成'), tone: 'success' };
		return { label: DSP.t('可练习'), tone: 'brand' };
	}
	return { label: DSP.t('待解析'), tone: 'warn' };
}

function courseHomeDocStatus(doc) {
	const status = doc && doc.status;
	if (status === 'ready') {
		const chars = Number(doc.chars) || 0;
		return {
			tone: 'success',
			text: chars > 0 ? DSP.t('已提取文本') + ' · ' + String(chars) + ' ' + DSP.t('字') : '已上传（Agent 可读）'
		};
	}
	if (status === 'empty') return { tone: 'warn', text: DSP.t('未提取到文字') };
	if (status === 'unsupported') return { tone: 'neutral', text: DSP.t('不支持该格式的文本抽取') };
	if (status === 'failed') {
		return { tone: 'error', text: DSP.t('抽取失败') + (doc.error ? '：' + String(doc.error) : '') };
	}
	return { tone: 'neutral', text: DSP.t('待处理') };
}

function courseHomeSetAccuracy(course, setId) {
	const records = (course && course.records ? course.records : []).filter(function (record) {
		return record && record.setId === setId;
	});
	return DSP.accuracyOf(DSP.latestRecords(records));
}

function CourseHomeChip(props) {
	return h(
		'span',
		{ className: 'dsp-chip' },
		props.icon ? h('span', { className: 'dsp-chip-icon' }, h(DSP.Icon, { name: props.icon, size: 13 })) : null,
		h('span', { className: 'dsp-chip-label' }, props.label),
		h('span', { className: 'dsp-chip-value' }, props.value)
	);
}

function CourseHomeSetRow(props) {
	const set = props.set;
	const course = props.course;
	const parse = props.parse;
	const status = courseHomeSetStatus(set);
	const parsingHere = Boolean(parse && parse.setId === set.id && parse.status === 'running');
	const parsing = parsingHere || set.status === 'parsing';
	const questionCount = Number(set.questionCount) || 0;
	const answeredCount = Number(set.answeredCount) || 0;
	const accuracy = courseHomeSetAccuracy(course, set.id);
	const aiAnswerMode = set.aiAnswerMode === 'off' || set.aiAnswerMode === 'regenerate' ? set.aiAnswerMode : 'auto';
	const answerFiles = (set.sourceFiles || []).filter(function (file) {
		return file && file.role === 'answers';
	});
	const answerFileNames = answerFiles
		.map(function (file) {
			return file.name || file.relPath || '';
		})
		.filter(Boolean)
		.join('、');
	const answerInputRef = React.useRef(null);
	const answerBusyState = React.useState(false);
	const answerBusy = answerBusyState[0];
	const setAnswerBusy = answerBusyState[1];
	const modeBusyState = React.useState(false);
	const modeBusy = modeBusyState[0];
	const setModeBusy = modeBusyState[1];
	const controlsDisabled = parsing || answerBusy || modeBusy;
	const aiModeOptions = [
		{ value: 'auto', label: DSP.t('自动补充缺失答案') },
		{ value: 'off', label: DSP.t('不生成 AI 答案') },
		{ value: 'regenerate', label: DSP.t('全部 AI 重新生成') }
	];

	function pickAnswerFiles() {
		if (controlsDisabled) return;
		if (answerInputRef.current) answerInputRef.current.click();
	}

	/* 补传答案：上传后立即重新解析（调用模型），失败 toast。 */
	function handleAnswerFiles(fileList) {
		if (!course || controlsDisabled) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		const confirmed = window.confirm(DSP.t('上传后将重新解析本套题并调用模型，是否继续？'));
		if (!confirmed) return;
		setAnswerBusy(true);
		Promise.resolve(DSP.store.actions.uploadAnswerFiles(course.id, set.id, files))
			.then(function () {
				return DSP.store.actions.startParse(course.id, set.id);
			})
			.catch(function (failure) {
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			})
			.then(function () {
				setAnswerBusy(false);
			});
	}

	function changeAiAnswerMode(mode) {
		if (controlsDisabled || mode === aiAnswerMode) return;
		setModeBusy(true);
		Promise.resolve(DSP.store.actions.setAiAnswerMode(course.id, set.id, mode))
			.catch(function (failure) {
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			})
			.then(function () {
				setModeBusy(false);
			});
	}

	const actions = [];
	if (parsingHere) {
		actions.push(
			h(DSP.Btn, { key: 'parsing', variant: 'secondary', loading: true, disabled: true, className: 'dsp-btn-sm' }, DSP.t('正在解析'))
		);
	} else if (set.status === 'parsing') {
		/* 服务端仍标记解析中但没有本地 job（例如上次进程中断），允许重新解析。 */
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'secondary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	} else if (set.status === 'failed') {
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'primary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	} else if (set.status === 'draft') {
		actions.push(
			h(DSP.Btn, { key: 'parse', variant: 'primary', icon: 'sparkles', className: 'dsp-btn-sm', onClick: props.onStartParse }, DSP.t('开始解析'))
		);
	} else if (set.status === 'ready') {
		const label = set.completedAt ? DSP.t('查看结果') : answeredCount > 0 ? DSP.t('继续刷题') : DSP.t('开始刷题');
		actions.push(
			h(
				DSP.Btn,
				{ key: 'open', variant: 'primary', icon: set.completedAt ? 'eye' : 'play', className: 'dsp-btn-sm', onClick: props.onOpen },
				label
			)
		);
	}
	actions.push(
		h(
			DSP.Btn,
			{
				key: 'answers',
				variant: 'secondary',
				icon: 'upload',
				className: 'dsp-btn-sm',
				loading: answerBusy,
				disabled: controlsDisabled,
				onClick: pickAnswerFiles
			},
			answerFiles.length > 0 ? '重新提交答案' : DSP.t('补传答案')
		)
	);
	if (set.status === 'ready') {
		actions.push(
			h(
				DSP.Btn,
				{ key: 'reparse', variant: 'secondary', icon: 'refresh', className: 'dsp-btn-sm', onClick: props.onReparse },
				DSP.t('重新解析')
			)
		);
	}
	actions.push(
		h(DSP.IconBtn, { key: 'delete', icon: 'trash', danger: true, label: DSP.t('删除'), onClick: props.onDelete })
	);

	return h(
		'div',
		{ className: 'dsp-set-row' },
		h('input', {
			ref: answerInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_QUESTION_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			disabled: controlsDisabled,
			onChange: function (event) {
				const files = event.target.files;
				event.target.value = '';
				handleAnswerFiles(files);
			}
		}),
		h(
			'div',
			{ className: 'dsp-set-main' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8 dsp-set-title-row' },
				h('span', { className: 'dsp-set-title dsp-truncate', title: set.title || '' }, set.title || DSP.t('未命名套题')),
				h(DSP.Tag, { tone: status.tone }, status.label),
				answerFiles.length > 0
					? h(
							'span',
							{ className: 'dsp-set-answer-tag', title: answerFileNames ? DSP.t('答案文件') + '：' + answerFileNames : DSP.t('答案文件') },
							h(DSP.Tag, { tone: 'brand' }, DSP.t('含答案文件'))
						)
					: null
			),
			h(
				'div',
				{ className: 'dsp-set-meta dsp-small dsp-muted' },
				h('span', null, DSP.t('题数') + ' ' + String(questionCount)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.t('已答') + ' ' + String(answeredCount) + '/' + String(questionCount)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.t('正确率') + ' ' + (accuracy === null ? '—' : DSP.fmtPct(accuracy))),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', null, DSP.fmtShortDate(set.updatedAt || set.createdAt))
			),
			h(
				'div',
				{ className: 'dsp-set-ai-row' },
				h('span', { className: 'dsp-set-ai-label' }, DSP.t('AI 答案解析')),
				h(
					'div',
					{ className: 'dsp-set-ai-control', role: 'group', 'aria-label': DSP.t('AI 答案解析') },
					aiModeOptions.map(function (option) {
						const active = option.value === aiAnswerMode;
						return h(
							'button',
							{
								key: option.value,
								type: 'button',
								className: 'dsp-set-ai-option' + (active ? ' dsp-set-ai-option-active' : ''),
								'aria-pressed': active,
								disabled: controlsDisabled,
								onClick: function () { changeAiAnswerMode(option.value); }
							},
							option.label
						);
					})
				),
				h('span', { className: 'dsp-set-ai-hint' }, DSP.t('重新解析后生效'))
			),
			set.status === 'failed' && set.error ? h('div', { className: 'dsp-inline-error' }, String(set.error)) : null,
			parsingHere
				? h(
						'div',
						{ className: 'dsp-set-progress' },
						h(DSP.ProgressBar, { value: courseUiProgressFraction(parse.progress) }),
						h('span', { className: 'dsp-small dsp-muted' }, parse.message || DSP.t('正在解析'))
					)
				: null
		),
		h('div', { className: 'dsp-set-actions' }, actions)
	);
}

function CourseHomeDocRow(props) {
	const doc = props.doc;
	const relativePath = courseHomeDocRelativePath(doc);
	const fileName = props.fileName || courseHomeDocFileName(doc, relativePath);
	const ext = String(doc.ext || '').toLowerCase();
	const isImage = COURSE_HOME_IMAGE_EXTS.indexOf(ext) >= 0;
	const status = courseHomeDocStatus(doc);
	return h(
		'div',
		{ className: 'dsp-doc-row' },
		h('span', { className: 'dsp-doc-icon' }, h(DSP.Icon, { name: isImage ? 'image' : 'doc', size: 16 })),
		h(
			'div',
			{ className: 'dsp-doc-main' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-6 dsp-doc-title-row' },
				h('span', { className: 'dsp-doc-name dsp-truncate', title: relativePath || doc.name || '' }, fileName),
				ext ? h(DSP.Tag, { tone: 'neutral' }, ext) : null
			),
			h(
				'div',
				{ className: 'dsp-doc-meta dsp-small dsp-muted' },
				h('span', null, DSP.fmtBytes(doc.size)),
				h('span', { className: 'dsp-set-meta-sep' }, '·'),
				h('span', { className: 'dsp-doc-status dsp-doc-status-' + status.tone }, status.text)
			)
		),
		h(DSP.IconBtn, { icon: 'trash', danger: true, label: DSP.t('删除'), onClick: props.onDelete })
	);
}

/* 上传弹窗文件去重/展示 helper：同一文件（路径+大小+修改时间）只保留一次。 */
function courseHomeFileKey(file) {
	if (!file) return '';
	const path = file.__dspRelativePath || file.webkitRelativePath || file.name || '';
	return path + '|' + String(Number(file.size) || 0) + '|' + String(Number(file.lastModified) || 0);
}

function courseHomeFileLabel(file) {
	if (!file) return '';
	return file.__dspRelativePath || file.webkitRelativePath || file.name || '';
}

function courseHomeMergeFiles(current, incoming) {
	const merged = (current || []).slice();
	const seen = new Set();
	merged.forEach(function (file) {
		seen.add(courseHomeFileKey(file));
	});
	(incoming || []).forEach(function (file) {
		const key = courseHomeFileKey(file);
		if (seen.has(key)) return;
		seen.add(key);
		merged.push(file);
	});
	return merged;
}

function CourseHomeUploadFileRow(props) {
	const file = props.file;
	const name = file.name || DSP.t('未命名文件');
	const path = props.path || '';
	return h(
		'div',
		{ className: 'dsp-upload-file-row' },
		h('span', { className: 'dsp-upload-file-icon' }, h(DSP.Icon, { name: 'doc', size: 14 })),
		h(
			'div',
			{ className: 'dsp-upload-file-main' },
			h('span', { className: 'dsp-upload-file-name dsp-truncate', title: path || name }, name),
			path && path !== name ? h('span', { className: 'dsp-upload-file-path dsp-truncate', title: path }, path) : null
		),
		h('span', { className: 'dsp-upload-file-size' }, DSP.fmtBytes(file.size)),
		h(DSP.IconBtn, { icon: 'x', label: DSP.t('移除'), disabled: Boolean(props.disabled), onClick: props.onRemove })
	);
}

/* 「上传题目」弹窗：已选试卷文件可增删，可再挂答案文件；确认后一次上传并开始解析。 */
function CourseHomeUploadModal(props) {
	const course = props.course;
	const questionState = React.useState(function () {
		return Array.isArray(props.initialQuestionFiles) ? props.initialQuestionFiles.slice() : [];
	});
	const questionFiles = questionState[0];
	const setQuestionFiles = questionState[1];
	const answerState = React.useState([]);
	const answerFiles = answerState[0];
	const setAnswerFiles = answerState[1];
	const uploadState = React.useState(false);
	const uploading = uploadState[0];
	const setUploading = uploadState[1];
	const errorState = React.useState(null);
	const error = errorState[0];
	const setError = errorState[1];
	const dragState = React.useState(null); // 'question' | 'answer' | null
	const dragTarget = dragState[0];
	const setDragTarget = dragState[1];
	const readState = React.useState(null); // 正在读取文件夹的区域
	const readingTarget = readState[0];
	const setReadingTarget = readState[1];
	const questionInputRef = React.useRef(null);
	const answerInputRef = React.useRef(null);

	function toastSkipped(skipped) {
		const list = skipped || [];
		if (list.length === 0) return;
		DSP.store.actions.toast(DSP.t('已跳过') + ' ' + String(list.length) + ' ' + DSP.t('个不支持的文件'), 'warn');
	}

	function addQuestionFiles(fileList) {
		const result = DSP.store.actions.filterFiles(fileList, 'question');
		toastSkipped(result.skipped);
		if (result.accepted.length === 0) return;
		setQuestionFiles(function (current) {
			return courseHomeMergeFiles(current, result.accepted);
		});
	}

	function addAnswerFiles(fileList) {
		const result = DSP.store.actions.filterFiles(fileList, 'question');
		toastSkipped(result.skipped);
		if (result.accepted.length === 0) return;
		setAnswerFiles(function (current) {
			return courseHomeMergeFiles(current, result.accepted);
		});
	}

	function removeQuestionFile(index) {
		setQuestionFiles(function (current) {
			return current.filter(function (file, position) {
				return position !== index;
			});
		});
	}

	function removeAnswerFile(index) {
		setAnswerFiles(function (current) {
			return current.filter(function (file, position) {
				return position !== index;
			});
		});
	}

	function pickQuestionFiles() {
		if (uploading) return;
		if (questionInputRef.current) questionInputRef.current.click();
	}

	function pickAnswerFiles() {
		if (uploading) return;
		if (answerInputRef.current) answerInputRef.current.click();
	}

	function onInputChange(addFiles) {
		return function (event) {
			const files = event.target.files;
			event.target.value = '';
			addFiles(files);
		};
	}

	function addFilesToZone(target, fileList) {
		if (target === 'question') addQuestionFiles(fileList);
		else addAnswerFiles(fileList);
	}

	function onZoneDragOver(target, event) {
		if (!courseHomeIsFileDrag(event) || uploading) return;
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
		setDragTarget(target);
	}

	function onZoneDragLeave(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		const related = event.relatedTarget;
		if (related && event.currentTarget && event.currentTarget.contains(related)) return;
		setDragTarget(function (current) {
			return current === target ? null : current;
		});
	}

	function onZoneDrop(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
		if (uploading || readingTarget) return;
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		const entries = courseHomeDropEntries(dataTransfer);
		const hasDirectory = entries.some(function (entry) {
			return Boolean(entry && entry.isDirectory);
		});
		if (!hasDirectory) {
			addFilesToZone(target, courseHomeFilesFromDataTransfer(dataTransfer));
			return;
		}
		setReadingTarget(target);
		DSP.store.actions.toast(DSP.t('正在读取文件夹…'), 'info');
		courseHomeReadDroppedEntries(entries)
			.then(function (result) {
				setReadingTarget(null);
				if (result.truncated) {
					DSP.store.actions.toast(DSP.t('拖入的文件超过 300 个，已保留前 300 个'), 'warn');
				}
				if (result.files.length === 0) return;
				addFilesToZone(target, result.files);
			})
			.catch(function (failure) {
				setReadingTarget(null);
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			});
	}

	function submit() {
		if (uploading) return;
		if (questionFiles.length === 0) {
			const message = DSP.t('请至少选择一个试卷文件');
			setError(message);
			DSP.store.actions.toast(message, 'warn');
			return;
		}
		setError(null);
		setUploading(true);
		Promise.resolve(DSP.store.actions.uploadExamSet(course.id, questionFiles, answerFiles))
			.then(function () {
				if (typeof props.onClose === 'function') props.onClose();
			})
			.catch(function (failure) {
				const message = courseHomeErrorText(failure);
				setUploading(false);
				setError(message);
				DSP.store.actions.toast(message, 'error');
			});
	}

	function close() {
		if (uploading) return;
		if (typeof props.onClose === 'function') props.onClose();
	}

	function dropZone(target, emptyText, fileList, removeFile) {
		return h(
			'div',
			{
				className: 'dsp-upload-drop' + (dragTarget === target ? ' dsp-drop-active' : ''),
				onDragOver: function (event) { onZoneDragOver(target, event); },
				onDragLeave: function (event) { onZoneDragLeave(target, event); },
				onDrop: function (event) { onZoneDrop(target, event); }
			},
			dragTarget === target
				? h(
						'div',
						{ className: 'dsp-drop-hint' },
						h(DSP.Icon, { name: 'upload', size: 16 }),
						h('span', null, target === 'question' ? DSP.t('松开以上传试卷文件') : DSP.t('松开以上传答案文件'))
					)
				: null,
			fileList.length === 0
				? h('div', { className: 'dsp-upload-empty' }, emptyText)
				: h(
						'div',
						{ className: 'dsp-upload-file-list' },
						fileList.map(function (file, index) {
							return h(CourseHomeUploadFileRow, {
								key: courseHomeFileKey(file) + '-' + index,
								file: file,
								path: courseHomeFileLabel(file),
								disabled: uploading,
								onRemove: function () { removeFile(index); }
							});
						})
					),
			readingTarget === target
				? h(
						'div',
						{ className: 'dsp-upload-status dsp-small dsp-muted' },
						h(DSP.Spinner, { size: 14 }),
						h('span', null, DSP.t('正在读取文件夹…'))
					)
				: null
		);
	}

	return h(
		DSP.Modal,
		{
			open: true,
			title: DSP.t('上传题目'),
			onClose: close,
			width: '680px',
			footer: [
				h(DSP.Btn, { key: 'cancel', variant: 'ghost', disabled: uploading, onClick: close }, DSP.t('取消')),
				h(
					DSP.Btn,
					{
						key: 'upload',
						variant: 'primary',
						icon: 'upload',
						loading: uploading,
						disabled: uploading || Boolean(readingTarget),
						onClick: submit
					},
					DSP.t('上传并开始解析')
				)
			]
		},
		h(
			'div',
			{ className: 'dsp-upload-modal' },
			h(
				'div',
				{ className: 'dsp-upload-group' },
				h(
					'div',
					{ className: 'dsp-upload-group-head' },
					h('span', { className: 'dsp-upload-group-title' }, DSP.t('试卷文件')),
					h(
						DSP.Btn,
						{ variant: 'secondary', icon: 'plus', className: 'dsp-btn-sm', disabled: uploading, onClick: pickQuestionFiles },
						DSP.t('添加文件')
					)
				),
				dropZone('question', DSP.t('选择或拖入试卷文件'), questionFiles, removeQuestionFile)
			),
			h(
				'div',
				{ className: 'dsp-upload-group' },
				h(
					'div',
					{ className: 'dsp-upload-group-head' },
					h(
						'span',
						{ className: 'dsp-upload-group-title' },
						DSP.t('答案文件'),
						h('span', { className: 'dsp-upload-optional' }, DSP.t('可选'))
					),
					h(
						DSP.Btn,
						{ variant: 'secondary', icon: 'plus', className: 'dsp-btn-sm', disabled: uploading, onClick: pickAnswerFiles },
						DSP.t('添加文件')
					)
				),
				dropZone('answer', DSP.t('答案文件可选，留空将按 AI 答案解析设置生成'), answerFiles, removeAnswerFile)
			),
			error ? h('div', { className: 'dsp-inline-error', role: 'alert' }, error) : null,
			h('input', {
				ref: questionInputRef,
				className: 'dsp-file-input',
				type: 'file',
				multiple: true,
				accept: COURSE_HOME_QUESTION_ACCEPT,
				tabIndex: -1,
				'aria-hidden': 'true',
				onChange: onInputChange(addQuestionFiles)
			}),
			h('input', {
				ref: answerInputRef,
				className: 'dsp-file-input',
				type: 'file',
				multiple: true,
				accept: COURSE_HOME_QUESTION_ACCEPT,
				tabIndex: -1,
				'aria-hidden': 'true',
				onChange: onInputChange(addAnswerFiles)
			})
		)
	);
}

function CourseHomeView() {
	const storeState = DSP.useStore(function (state) {
		const courses = state.data.courses || [];
		return {
			course: courses.find(function (item) { return item.id === state.ui.courseId; }) || null,
			parse: state.ui.parse,
			loading: state.loading
		};
	});
	const course = storeState.course;
	const parse = storeState.parse;
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const editState = React.useState(false);
	const editing = editState[0];
	const setEditing = editState[1];
	const uploadModalState = React.useState(null); // { key, files } 打开「上传题目」弹窗
	const uploadModal = uploadModalState[0];
	const setUploadModal = uploadModalState[1];
	const docsUploadState = React.useState(false);
	const docsUploading = docsUploadState[0];
	const setDocsUploading = docsUploadState[1];
	const docsErrorState = React.useState(null);
	const docsError = docsErrorState[0];
	const setDocsError = docsErrorState[1];
	const dragState = React.useState(null); // 'questions' | 'docs' | null
	const dragTarget = dragState[0];
	const setDragTarget = dragState[1];
	const dragReadState = React.useState(null); // 正在读取拖入文件夹的区块
	const dragReadingTarget = dragReadState[0];
	const setDragReadingTarget = dragReadState[1];
	const docsOpenState = React.useState(function () {
		return courseHomeReadDocsOpen(course ? course.id : null);
	});
	const docsOpen = docsOpenState[0];
	const setDocsOpen = docsOpenState[1];
	const questionInputRef = React.useRef(null);
	const docInputRef = React.useRef(null);
	const folderInputRef = React.useRef(null);
	const courseId = course ? course.id : null;

	React.useEffect(function () {
		setDocsError(null);
		setDragTarget(null);
		setDragReadingTarget(null);
		setDocsOpen(courseHomeReadDocsOpen(courseId));
		setUploadModal(null);
	}, [courseId]);

	function toastError(message) {
		DSP.store.actions.toast(message, 'error');
	}

	/* 上传题目：先打开确认弹窗（可同时选答案文件），确认后才上传并解析。 */
	function openUploadModal(fileList) {
		if (!course) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		const result = DSP.store.actions.filterFiles(files, 'question');
		if (result.skipped.length > 0) {
			DSP.store.actions.toast(
				DSP.t('已跳过') + ' ' + String(result.skipped.length) + ' ' + DSP.t('个不支持的文件'),
				'warn'
			);
		}
		if (result.accepted.length === 0) {
			DSP.store.actions.toast(DSP.t('没有可上传的题目文件'), 'warn');
			return;
		}
		setUploadModal({ key: 'upload-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), files: result.accepted });
	}

	function handleDocFiles(fileList) {
		if (!course || docsUploading) return;
		const files = Array.from(fileList || []);
		if (files.length === 0) return;
		setDocsError(null);
		setDocsUploading(true);
		DSP.store.actions.toast(DSP.t('正在上传课程文档…'), 'info');
		Promise.resolve(DSP.store.actions.uploadDocs(course.id, files))
			.catch(function (failure) {
				const message = courseHomeErrorText(failure);
				setDocsError(message);
				toastError(message);
				/* 逐个上传时可能已成功部分文件，失败后重新同步 bootstrap。 */
				DSP.store.actions.reload().catch(function () {});
			})
			.then(function () {
				setDocsUploading(false);
			});
	}

	function onFileInputChange(handler) {
		return function (event) {
			const files = event.target.files;
			handler(files);
			event.target.value = '';
		};
	}

	function openPractice(set) {
		if (!course) return;
		DSP.store.actions.openPractice(course.id, set.id);
	}

	function startParse(set) {
		if (!course) return;
		Promise.resolve(DSP.store.actions.startParse(course.id, set.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	/* 重新解析（应用答案文件 / AI 答案解析模式）：二次确认后调用 startParse。 */
	function reparseSet(set) {
		if (!course) return;
		const confirmed = window.confirm(DSP.t('将重新调用模型解析本套题，是否继续？'));
		if (!confirmed) return;
		startParse(set);
	}

	function removeSet(set) {
		if (!course) return;
		const label = set.title || DSP.t('未命名套题');
		const confirmed = window.confirm(DSP.t('确定删除') + '「' + label + '」' + DSP.t('吗？'));
		if (!confirmed) return;
		Promise.resolve(DSP.store.actions.deleteSet(course.id, set.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	function removeDoc(doc) {
		if (!course) return;
		const label = courseHomeDocRelativePath(doc) || doc.name || DSP.t('未命名文档');
		const confirmed = window.confirm(DSP.t('确定删除') + '「' + label + '」' + DSP.t('吗？'));
		if (!confirmed) return;
		Promise.resolve(DSP.store.actions.deleteDoc(course.id, doc.id)).catch(function (failure) {
			toastError(courseHomeErrorText(failure));
		});
	}

	/* 拖拽：题目集/课程文档两个区块共用一套处理（高亮 + 松开提示 + drop 上传）。 */
	const parseRunning = Boolean(parse && parse.status === 'running');
	const questionsDragDisabled = parseRunning;
	const docsDragDisabled = docsUploading;

	function toggleDocsOpen() {
		const next = !docsOpen;
		setDocsOpen(next);
		if (course) courseHomeWriteDocsOpen(course.id, next);
	}

	function openDocsSection() {
		if (docsOpen) return;
		setDocsOpen(true);
		if (course) courseHomeWriteDocsOpen(course.id, true);
	}

	function isDragDisabled(target) {
		if (dragReadingTarget) return true;
		return target === 'questions' ? questionsDragDisabled : docsDragDisabled;
	}

	function onSectionDragOver(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		if (!event.dataTransfer) return;
		event.dataTransfer.dropEffect = 'copy';
		if (isDragDisabled(target)) {
			setDragTarget(function (current) {
				return current === target ? null : current;
			});
			return;
		}
		if (target === 'docs') openDocsSection();
		setDragTarget(target);
	}

	function onSectionDragLeave(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		const related = event.relatedTarget;
		if (related && event.currentTarget && event.currentTarget.contains(related)) return;
		setDragTarget(function (current) {
			return current === target ? null : current;
		});
	}

	function onSectionDrop(target, event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
		if (isDragDisabled(target)) return;
		if (target === 'docs') openDocsSection();
		const dataTransfer = event.dataTransfer;
		if (!dataTransfer) return;
		const entries = courseHomeDropEntries(dataTransfer);
		const hasDirectory = entries.some(function (entry) {
			return Boolean(entry && entry.isDirectory);
		});
		if (!hasDirectory) {
			/* 普通文件拖入（或浏览器不支持 webkitGetAsEntry）直接走 dataTransfer.files。 */
			const files = courseHomeFilesFromDataTransfer(dataTransfer);
			if (files.length === 0) return;
			if (target === 'questions') openUploadModal(files);
			else handleDocFiles(files);
			return;
		}
		/* 拖入文件夹：先提示读取中，递归收集 File 后再走 store.actions 上传。 */
		setDragReadingTarget(target);
		DSP.store.actions.toast(DSP.t('正在读取文件夹…'), 'info');
		courseHomeReadDroppedEntries(entries)
			.then(function (result) {
				setDragReadingTarget(null);
				if (result.truncated) {
					DSP.store.actions.toast(DSP.t('拖入的文件超过 300 个，已保留前 300 个'), 'warn');
				}
				if (result.files.length === 0) {
					DSP.store.actions.toast(DSP.t('拖入的文件夹中没有可上传的文件'), 'warn');
					return;
				}
				if (target === 'questions') openUploadModal(result.files);
				else handleDocFiles(result.files);
			})
			.catch(function (failure) {
				setDragReadingTarget(null);
				DSP.store.actions.toast(courseHomeErrorText(failure), 'error');
			});
	}

	/* 根节点兜底：阻止浏览器把拖入文件直接打开。 */
	function onRootDragOver(event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
	}

	function onRootDrop(event) {
		if (!courseHomeIsFileDrag(event)) return;
		event.preventDefault();
		setDragTarget(null);
	}

	const questionInputs = h(
		React.Fragment,
		null,
		h('input', {
			key: 'question-input',
			ref: questionInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_QUESTION_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(openUploadModal)
		}),
		h('input', {
			key: 'doc-input',
			ref: docInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			accept: COURSE_HOME_DOC_ACCEPT,
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(handleDocFiles)
		}),
		h('input', {
			key: 'folder-input',
			ref: folderInputRef,
			className: 'dsp-file-input',
			type: 'file',
			multiple: true,
			webkitdirectory: 'true',
			tabIndex: -1,
			'aria-hidden': 'true',
			onChange: onFileInputChange(handleDocFiles)
		})
	);

	if (!course) {
		return h(
			'div',
			{ className: 'dsp-page dsp-course-page', onDragOver: onRootDragOver, onDrop: onRootDrop },
			h(
				'div',
				{ className: 'dsp-page-head' },
				h(
					'div',
					{ className: 'dsp-col dsp-gap-6' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('课程主页'))
				)
			),
			h(
				'div',
				{ className: 'dsp-scroll' },
				h(
					'div',
					{ className: 'dsp-page-body' },
					h(
						'div',
						{ className: 'dsp-card' },
						h(
							DSP.Empty,
							{
								icon: 'book',
								title: DSP.t('暂无课程'),
								action: h(
									DSP.Btn,
									{ variant: 'primary', icon: 'plus', onClick: function () { setCreating(true); } },
									DSP.t('新建课程')
								)
							},
							DSP.t('新建课程即可上传课程文档与题目文件')
						)
					)
				)
			),
			creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
		);
	}

	const sets = (course.sets || []).slice().sort(function (left, right) {
		return (Number(right.createdAt) || 0) - (Number(left.createdAt) || 0);
	});
	const docs = (course.docs || []).slice().sort(function (left, right) {
		return (Number(right.addedAt) || 0) - (Number(left.addedAt) || 0);
	});
	const docGroups = courseHomeDocGroups(docs);
	const retrievableDocs = docs.filter(function (doc) {
		return doc && doc.status === 'ready' && (Number(doc.chars) || 0) > 0;
	}).length;
	const latest = DSP.latestRecords(course.records || []);
	const accuracy = DSP.accuracyOf(latest);
	const completedCount = sets.filter(function (set) { return Boolean(set.completedAt); }).length;
	const uploadingDocs = docsUploading;

	return h(
		'div',
		{ className: 'dsp-page dsp-course-page', onDragOver: onRootDragOver, onDrop: onRootDrop },
		questionInputs,
		h(
			'div',
			{ className: 'dsp-page-head dsp-course-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-course-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-course-title-row' },
					h(
						'h1',
						{ className: 'dsp-page-title' },
						h('span', { className: 'dsp-truncate', title: course.name || '' }, course.name || DSP.t('未命名课程')),
						h(DSP.IconBtn, {
							icon: 'edit',
							label: DSP.t('编辑课程'),
							title: DSP.t('编辑课程'),
							onClick: function () { setEditing(true); }
						})
					)
				),
				h('p', { className: 'dsp-page-sub dsp-course-desc' }, course.description || DSP.t('暂无课程简介')),
				h(
					'div',
					{ className: 'dsp-chips' },
					h(CourseHomeChip, { icon: 'layers', label: DSP.t('题目集'), value: String(sets.length) }),
					h(CourseHomeChip, { icon: 'checkCircle', label: DSP.t('已完成套数'), value: String(completedCount) }),
					h(CourseHomeChip, { icon: 'target', label: DSP.t('总正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy) })
				)
			),
			h(
				'div',
				{ className: 'dsp-course-head-actions' },
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'layers',
						onClick: function () { DSP.store.actions.openGlobalDash(); }
					},
					DSP.t('所有课程')
				),
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'chart',
						onClick: function () { DSP.store.actions.openCourseDash(course.id); }
					},
					DSP.t('课程看板')
				),
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'upload',
						onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
					},
					DSP.t('上传题目文件')
				)
			)
		),
		h(
			'div',
			{ className: 'dsp-scroll' },
			h(
				'div',
				{ className: 'dsp-page-body' },
				h(
					'section',
					{
						className: 'dsp-card dsp-set-section' + (dragTarget === 'questions' ? ' dsp-drop-active' : ''),
						onDragOver: function (event) { onSectionDragOver('questions', event); },
						onDragLeave: function (event) { onSectionDragLeave('questions', event); },
						onDrop: function (event) { onSectionDrop('questions', event); }
					},
					h(
						'div',
						{ className: 'dsp-section-head' },
						h(
							'div',
							{ className: 'dsp-row dsp-gap-8' },
							h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'list', size: 16 })),
							h('h2', { className: 'dsp-section-title' }, DSP.t('题目集')),
							sets.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(sets.length)) : null
						),
						h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'upload',
								className: 'dsp-btn-sm',
								onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
							},
							DSP.t('上传题目文件')
						)
					),
					dragTarget === 'questions'
						? h(
								'div',
								{ className: 'dsp-drop-hint' },
								h(DSP.Icon, { name: 'upload', size: 16 }),
								h('span', null, DSP.t('松开以上传题目文件'))
							)
						: null,
					dragReadingTarget === 'questions'
						? h(
								'div',
								{ className: 'dsp-upload-status dsp-small dsp-muted' },
								h(DSP.Spinner, { size: 14 }),
								h('span', null, DSP.t('正在读取文件夹…'))
							)
						: null,
					sets.length === 0
						? h(
								DSP.Empty,
								{
									icon: 'list',
									title: DSP.t('上传一套题目文件开始'),
									action: h(
										DSP.Btn,
										{
											variant: 'primary',
											icon: 'upload',
											onClick: function () { if (questionInputRef.current) questionInputRef.current.click(); }
										},
										DSP.t('上传题目文件')
									)
								},
								DSP.t('上传后会自动解析为结构化题目，随后即可开始练习。')
							)
						: h(
								'div',
								{ className: 'dsp-set-list' },
								sets.map(function (set) {
									return h(CourseHomeSetRow, {
										key: set.id,
										course: course,
										set: set,
										parse: parse,
										onOpen: function () { openPractice(set); },
										onStartParse: function () { startParse(set); },
										onReparse: function () { reparseSet(set); },
										onDelete: function () { removeSet(set); }
									});
								})
							)
				),
				h(
					'section',
					{
						className: 'dsp-card dsp-doc-section' + (dragTarget === 'docs' ? ' dsp-drop-active' : ''),
						onDragOver: function (event) { onSectionDragOver('docs', event); },
						onDragLeave: function (event) { onSectionDragLeave('docs', event); },
						onDrop: function (event) { onSectionDrop('docs', event); }
					},
					h(
						'button',
						{
							type: 'button',
							className: 'dsp-doc-section-head' + (docsOpen ? ' dsp-doc-section-head-open' : ''),
							'aria-expanded': docsOpen,
							title: docsOpen ? DSP.t('收起课程文档') : DSP.t('展开课程文档'),
							onClick: toggleDocsOpen
						},
						h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'folder', size: 16 })),
						h('span', { className: 'dsp-section-title' }, DSP.t('课程文档')),
						docs.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(docs.length)) : null,
						h('span', { className: 'dsp-doc-summary' }, DSP.t('可检索') + ' ' + String(retrievableDocs)),
						h('span', { className: 'dsp-doc-chevron' }, h(DSP.Icon, { name: 'chevronDown', size: 16 }))
					),
					dragTarget === 'docs'
						? h(
							'div',
							{ className: 'dsp-drop-hint' },
							h(DSP.Icon, { name: 'upload', size: 16 }),
							h('span', null, DSP.t('松开以上传课程文档'))
						)
						: null,
					docsError ? h('div', { className: 'dsp-inline-error', role: 'alert' }, docsError) : null,
					uploadingDocs
						? h(
							'div',
							{ className: 'dsp-upload-status dsp-small dsp-muted' },
							h(DSP.Spinner, { size: 14 }),
							h('span', null, DSP.t('上传中') + ' · ' + DSP.t('正在上传课程文档，请稍候…'))
						)
						: null,
					dragReadingTarget === 'docs'
						? h(
							'div',
							{ className: 'dsp-upload-status dsp-small dsp-muted' },
							h(DSP.Spinner, { size: 14 }),
							h('span', null, DSP.t('正在读取文件夹…'))
						)
						: null,
					docsOpen
						? h(
							'div',
							{ className: 'dsp-doc-section-body' },
							h(
								'div',
								{ className: 'dsp-upload-actions' },
								h(
									DSP.Btn,
									{
										variant: 'secondary',
										icon: 'upload',
										className: 'dsp-btn-sm',
										loading: uploadingDocs,
										disabled: uploadingDocs,
										onClick: function () { if (docInputRef.current) docInputRef.current.click(); }
									},
									DSP.t('上传文件')
								),
								h(
									DSP.Btn,
									{
										variant: 'secondary',
										icon: 'folder',
										className: 'dsp-btn-sm',
										disabled: uploadingDocs,
										onClick: function () { if (folderInputRef.current) folderInputRef.current.click(); }
									},
									DSP.t('上传文件夹')
								)
							),
							docs.length === 0
								? h(
									DSP.Empty,
									{ icon: 'book', title: DSP.t('暂无课程文档') },
									DSP.t('支持 PDF / Word / PPT / 文本 / Markdown / HTML 等格式。')
								)
								: h(
									'div',
									{ className: 'dsp-doc-list' },
									docGroups.map(function (group) {
										const groupLabel = group.path || DSP.t('根目录');
										return h(
											'div',
											{ key: group.path || '__root__', className: 'dsp-doc-group' },
											h(
												'div',
												{ className: 'dsp-doc-group-head' },
												h('span', { className: 'dsp-doc-group-icon' }, h(DSP.Icon, { name: 'folder', size: 14 })),
												h('span', { className: 'dsp-doc-group-path dsp-truncate', title: groupLabel }, groupLabel),
												h('span', { className: 'dsp-doc-group-count' }, String(group.docs.length))
											),
											h(
												'div',
												{ className: 'dsp-doc-group-body' },
												group.docs.map(function (item) {
													return h(CourseHomeDocRow, {
														key: item.doc.id,
														doc: item.doc,
														fileName: item.fileName,
														onDelete: function () { removeDoc(item.doc); }
													});
												})
											)
										);
									})
								)
							)
						: null
				)
			)
		),
		uploadModal
			? h(CourseHomeUploadModal, {
					key: uploadModal.key,
					course: course,
					initialQuestionFiles: uploadModal.files,
					onClose: function () { setUploadModal(null); }
				})
			: null,
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null,
		editing ? h(DSP.CourseCreateModal, { course: course, onClose: function () { setEditing(false); } }) : null
	);
}

DSP.CourseHome = CourseHomeView;

/* ==== src/client/40-practice.js ==== */
/* 刷题模式 Client — 刷题区（中间核心区），practice-ui-dev 维护。
 *
 * 组件结构（本文件）：
 *   PracticeArea            根组件。读取 DSP.useStore 的 ui / course / setCache / capabilities，
 *                           按优先级渲染：解析进度 → 加载/错误/空态 → 结果页 → 模式选择 → 练习主体。
 *                           负责按 setId 加载 set.json、把当前题号写回 store.ui.questionIndex、
 *                           根节点 onMouseUp 转交 DSP.handlePracticeSelection（支持框选提问）。
 *   PracticeParseCard       解析中 / 解析失败的进度卡（Spinner + 进度条 + 重试 / 返回课程）。
 *   PracticeModeSelect      未开始练习时的模式选择卡（答一题看一题 / 全部做完再看）。
 *   PracticeTopBar          练习顶部条：返回课程、套题标题、第 i/n 题、已答、正确率、模式徽标、用时。
 *   PracticeQuestionNav     题号导航条：正确=success、错误=error、当前=brand、待自评=warn、未答=neutral。
 *   PracticeBody            练习主体：题目卡（41 文件）+ 底部按钮 + 交卷确认。
 *   PracticeFooter          上一题 / 下一题 / 提交 / 交卷。
 *   PracticeCapabilityHint  capabilities.images=false 时的图片输入提示（只影响扫描件解析）。
 *
 * 相邻碎片：
 *   41-practice-question.js  题目卡、共用材料、题图与「重新绘制」、按题型作答控件、解析区。
 *   42-practice-result.js    交卷结果页：本套统计、各题型正确率、待自评列表、生成复习建议。
 *
 * 接口约定（详见 docs/CONTRACT.md 第 6.4 节，以 20-store.js 实际实现为准）：
 *   只读：DSP.useStore；写：DSP.store.actions.{loadSet, setMode, saveRecords, completeSet,
 *   startParse, redrawFigure, diagnose, askQuestion, openCourse, openPractice, openCourseDash,
 *   openGlobalDash, ui, toast}。
 *
 * 本地作答状态：模块级 __practiceLocal[setId] = {answers, revealed, records, recordIds,
 * startedAt, finished, mode, hydrated}。切题 / 切看板（组件卸载再挂载）后不丢；首次进入从
 * 课程 records 恢复（revealed 视为已看答案，correct=null 视为待自评）。本地变更后调用
 * React.useState 的 bump 强制刷新。
 */

var __practiceLocal = {};

var PRACTICE_MODE_IMMEDIATE = 'immediate';
var PRACTICE_MODE_END = 'end';
var PRACTICE_TYPE_LABELS = { single: '单选', multiple: '多选', judge: '判断', fill: '填空', short: '简答', other: '其他' };
var PRACTICE_DIFFICULTY_LABELS = { easy: '简单', medium: '中等', hard: '困难' };

/* ------------------------------------------------------------------ */
/* 基础小工具                                                          */
/* ------------------------------------------------------------------ */

function pracToArray(value) {
	if (value === undefined || value === null || value === '') return [];
	if (Array.isArray(value)) {
		return value.map(function (item) {
			return item === undefined || item === null ? '' : String(item);
		});
	}
	return [String(value)];
}

function pracClampIndex(value, total) {
	const number = Number(value);
	const safe = Number.isFinite(number) ? Math.floor(number) : 0;
	if (!total || total <= 0) return 0;
	return Math.min(total - 1, Math.max(0, safe));
}

function pracProgressFraction(progress) {
	const number = Number(progress);
	if (!Number.isFinite(number) || number <= 0) return 0;
	if (number <= 1) return number;
	return Math.min(1, number / 100);
}

function pracToastError(error) {
	const message = error && error.message ? error.message : String(error || '请求失败');
	DSP.store.actions.toast(message, 'error');
}

function pracModeLabel(mode) {
	return mode === PRACTICE_MODE_END ? DSP.t('全部做完再看') : DSP.t('答一题看一题');
}

function pracTypeLabel(type) {
	return DSP.t(PRACTICE_TYPE_LABELS[type] || PRACTICE_TYPE_LABELS.other);
}

function pracDifficultyLabel(difficulty) {
	return DSP.t(PRACTICE_DIFFICULTY_LABELS[difficulty] || PRACTICE_DIFFICULTY_LABELS.medium);
}

function pracDifficultyTone(difficulty) {
	if (difficulty === 'hard') return 'warn';
	if (difficulty === 'easy') return 'success';
	return 'neutral';
}

function pracQuestionNumber(question, index) {
	const number = question && question.number !== undefined && question.number !== null && String(question.number).trim() !== '' ? String(question.number) : String(index + 1);
	return number;
}

function pracFindGroup(setData, groupId) {
	if (!groupId) return null;
	const groups = (setData && setData.groups) || [];
	return (
		groups.find(function (group) {
			return group && group.id === groupId;
		}) || null
	);
}

function pracQuestionStemText(question) {
	const stem = question && question.stem ? String(question.stem) : '';
	return stem.replace(/\s+/g, ' ').trim();
}

/* ------------------------------------------------------------------ */
/* 本地作答状态（模块级，按 setId 隔离）                               */
/* ------------------------------------------------------------------ */

function pracLocal(setId) {
	const key = String(setId || '');
	if (!__practiceLocal[key]) {
		__practiceLocal[key] = {
			answers: {},
			revealed: {},
			records: {},
			recordIds: {},
			grades: {}, // questionId -> {status:'running'|'done'|'error'|'stale', promise?, record?}
			startedAt: null,
			finished: false,
			mode: null,
			hydrated: false
		};
	}
	return __practiceLocal[key];
}

function pracLatestRecords(records, setId) {
	const map = {};
	(records || []).forEach(function (record) {
		if (!record || !record.questionId) return;
		if (setId && record.setId && record.setId !== setId) return;
		const key = String(record.questionId);
		const previous = map[key];
		const at = Number(record.at) || 0;
		const previousAt = previous ? Number(previous.at) || 0 : -1;
		if (!previous || at >= previousAt) map[key] = record;
	});
	return map;
}

/* 首次进入某套题时从 bootstrap 的 course.records 恢复。已恢复过则不再覆盖本地进度。 */
function pracEnsureLocal(records, setId, setSummary) {
	const local = pracLocal(setId);
	if (local.hydrated) return local;
	local.hydrated = true;
	const latest = pracLatestRecords(records || [], setId);
	let earliest = 0;
	let latestMode = null;
	let latestModeAt = -1;
	Object.keys(latest).forEach(function (questionId) {
		const record = latest[questionId];
		if (!record) return;
		local.recordIds[questionId] = record.id || DSP.uid('r');
		local.records[questionId] = record;
		local.answers[questionId] = pracToArray(record.answer);
		local.revealed[questionId] = Boolean(record.revealed);
		if (record.aiGrade) local.grades[questionId] = { status: 'done', record: record };
		const at = Number(record.at) || 0;
		if (at > 0 && (earliest === 0 || at < earliest)) earliest = at;
		if ((record.mode === PRACTICE_MODE_END || record.mode === PRACTICE_MODE_IMMEDIATE) && at >= latestModeAt) {
			latestMode = record.mode;
			latestModeAt = at;
		}
	});
	if (setSummary) {
		if (setSummary.mode) local.mode = setSummary.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
		if (setSummary.completedAt) local.finished = true;
		const startedAt = Number(setSummary.startedAt);
		if (Number.isFinite(startedAt) && startedAt > 0) local.startedAt = startedAt;
	}
	if (!local.mode && latestMode) local.mode = latestMode;
	if (!local.startedAt && earliest > 0) local.startedAt = earliest;
	return local;
}

/* 「再练一次」：保留 recordIds 以便同题重复提交时后端 upsert，而不是堆积新记录。 */
function pracRestartLocal(setId) {
	const local = pracLocal(setId);
	local.answers = {};
	local.revealed = {};
	local.records = {};
	local.grades = {};
	local.startedAt = null;
	local.finished = false;
	return local;
}

function pracEffectiveMode(local, ui, setSummary) {
	if (local && local.mode) return local.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	if (ui && ui.mode) return ui.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	if (setSummary && setSummary.mode) return setSummary.mode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE;
	return PRACTICE_MODE_IMMEDIATE;
}

/* ------------------------------------------------------------------ */
/* 判分 / 答案格式化                                                    */
/* ------------------------------------------------------------------ */

function pracHasAnswer(question, value) {
	const type = (question && question.type) || 'other';
	const list = pracToArray(value);
	if (list.length === 0) return false;
	if (type === 'multiple' || type === 'fill') {
		return list.some(function (item) {
			return String(item).trim() !== '';
		});
	}
	return String(list[0] || '').trim() !== '';
}

/* 提交给后端的规范化答案：选择题按选项顺序排序，其他保留数组。 */
function pracNormalizeWrite(question, value) {
	const type = (question && question.type) || 'other';
	const list = pracToArray(value).map(function (item) {
		return String(item).trim();
	});
	if (type === 'multiple') {
		const order = ((question && question.options) || []).map(function (option) {
			return String(option && option.key !== undefined ? option.key : '');
		});
		return list
			.slice()
			.sort(function (left, right) {
				const leftIndex = order.indexOf(left);
				const rightIndex = order.indexOf(right);
				return (leftIndex < 0 ? 999 : leftIndex) - (rightIndex < 0 ? 999 : rightIndex);
			});
	}
	return list;
}

function pracJudgeBool(text) {
	const value = String(text === undefined || text === null ? '' : text)
		.trim()
		.toLowerCase();
	if (value === '') return null;
	if (['正确', '对', '是', 'true', 't', 'a', '√', '✓', 'yes', 'y'].indexOf(value) >= 0) return true;
	if (['错误', '错', '否', 'false', 'f', 'b', '×', '✗', 'no', 'n'].indexOf(value) >= 0) return false;
	return null;
}

function pracJudgeCorrectKeys(question) {
	const first = pracToArray(question && question.answer)[0];
	const boolValue = pracJudgeBool(first);
	if (boolValue === true) return ['正确'];
	if (boolValue === false) return ['错误'];
	return pracToArray(question && question.answer).map(String);
}

/* 去空白、去常见中英文标点、全角转半角后比较，允许「1,000」与「1000」这类差异。 */
function pracNormalizeFill(text) {
	let value = String(text === undefined || text === null ? '' : text);
	value = value.replace(/[\uFF01-\uFF5E]/g, function (character) {
		return String.fromCharCode(character.charCodeAt(0) - 0xfee0);
	});
	value = value.replace(/\u3000/g, ' ');
	value = value.replace(/\s+/g, '');
	value = value.replace(/[。．.，,、；;：:！!？?（）()【】\[\]{}「」『』“”"'‘’《》〈〉<>…—\-_/\\|~`·*^#@$%&+=]/g, '');
	value = value.replace(/[０-９]/g, function (character) {
		return String.fromCharCode(character.charCodeAt(0) - 0xfee0);
	});
	return value.toLowerCase();
}

function pracEvaluate(question, value) {
	const type = (question && question.type) || 'other';
	const expected = pracToArray(question && question.answer);
	const user = pracNormalizeWrite(question, value);
	if (expected.length === 0) return { correct: null, selfGrade: true };
	if (type === 'single' || type === 'multiple') {
		const expectedKeys = expected.map(String).sort();
		const userKeys = user.map(String).sort();
		const same = expectedKeys.length === userKeys.length && expectedKeys.every(function (key, index) { return key === userKeys[index]; });
		return { correct: same, selfGrade: false };
	}
	if (type === 'judge') {
		const expectedBool = pracJudgeBool(expected[0]);
		const userBool = pracJudgeBool(user[0]);
		if (expectedBool === null || userBool === null) {
			return { correct: String(expected[0] || '') === String(user[0] || ''), selfGrade: false };
		}
		return { correct: expectedBool === userBool, selfGrade: false };
	}
	if (type === 'fill') {
		const expectedNorm = expected.map(pracNormalizeFill);
		const userNorm = user.map(pracNormalizeFill);
		const filled = userNorm.filter(function (item) { return item !== ''; });
		if (filled.length === 0) return { correct: null, selfGrade: true };
		const same = expectedNorm.length === userNorm.length && expectedNorm.every(function (item, index) { return item === userNorm[index]; });
		if (same) return { correct: true, selfGrade: false };
		/* 规范化后仍不一致（表述差异），revel 后交给用户自评。 */
		return { correct: null, selfGrade: true };
	}
	return { correct: null, selfGrade: true };
}

/* AI 判题 verdict → record.correct：correct/答对 → true，partial/incorrect/答错 → false。
 * verdict 缺失/无法识别时返回 null，调用方回退本地对比判分（不凭 score 猜测中间值）。 */
function pracAiGradeCorrect(aiGrade) {
	const raw = aiGrade && aiGrade.verdict !== undefined && aiGrade.verdict !== null ? String(aiGrade.verdict).trim().toLowerCase() : '';
	if (raw === 'correct' || raw === '答对' || raw === '正确') return true;
	if (raw === 'partial' || raw === '部分正确' || raw === '部分对' || raw === 'incorrect' || raw === 'wrong' || raw === '答错' || raw === '错误') return false;
	const score = Number(aiGrade && aiGrade.score);
	if (Number.isFinite(score)) {
		if (score >= 99.5) return true;
		if (score <= 0) return false;
	}
	return null;
}

function pracFormatAnswer(question) {
	if (!question) return '—';
	if (question.answerDisplay !== undefined && question.answerDisplay !== null && String(question.answerDisplay).trim() !== '') return String(question.answerDisplay);
	const type = question.type || 'other';
	const answer = pracToArray(question.answer).filter(function (item) { return String(item).trim() !== ''; });
	if (answer.length === 0) return '—';
	if (type === 'judge') {
		const boolValue = pracJudgeBool(answer[0]);
		if (boolValue === true) return '正确';
		if (boolValue === false) return '错误';
	}
	if (type === 'fill') return answer.join('；');
	if (type === 'short' || type === 'other') return answer.join('\n');
	return answer.join('、');
}

function pracFormatUserAnswer(question, answer) {
	const list = pracToArray(answer).filter(function (item) { return String(item).trim() !== ''; });
	if (list.length === 0) return DSP.t('未作答');
	if ((question && (question.type === 'short' || question.type === 'other')) || (question && question.type === 'fill')) return list.join('；');
	return list.join('、');
}

function pracCorrectChoiceTexts(question) {
	const options = (question && question.options) || [];
	const keys = question && question.type === 'judge' ? pracJudgeCorrectKeys(question) : pracToArray(question && question.answer).map(String);
	return keys
		.map(function (key) {
			const option = options.find(function (item) {
				return item && String(item.key) === key;
			});
			if (!option) return null;
			return String(option.key) + '. ' + String(option.text === undefined || option.text === null ? '' : option.text);
		})
		.filter(Boolean);
}

/* ------------------------------------------------------------------ */
/* 统计                                                                */
/* ------------------------------------------------------------------ */

function pracSetStats(questions, local) {
	const source = questions || [];
	const byType = {};
	const byTypeOrder = [];
	let answered = 0;
	let judged = 0;
	let correct = 0;
	source.forEach(function (question) {
		const type = (question && question.type) || 'other';
		if (!byType[type]) {
			byType[type] = { type: type, total: 0, answered: 0, judged: 0, correct: 0 };
			byTypeOrder.push(type);
		}
		const bucket = byType[type];
		bucket.total += 1;
		const record = question ? (local.records || {})[question.id] : null;
		if (!record) return;
		bucket.answered += 1;
		answered += 1;
		if (record.correct === true || record.correct === false) {
			bucket.judged += 1;
			judged += 1;
			if (record.correct === true) {
				bucket.correct += 1;
				correct += 1;
			}
		}
	});
	return {
		total: source.length,
		answered: answered,
		judged: judged,
		correct: correct,
		accuracy: judged > 0 ? correct / judged : null,
		byType: byTypeOrder.map(function (type) { return byType[type]; })
	};
}

function pracTotalDuration(questions, local) {
	let total = 0;
	(questions || []).forEach(function (question) {
		const record = question ? (local.records || {})[question.id] : null;
		const duration = record ? Number(record.durationMs) : 0;
		if (Number.isFinite(duration) && duration > 0) total += duration;
	});
	return total;
}

function pracQuestionNavState(question, local, currentIndex, index) {
	if (index === currentIndex) return 'current';
	const record = question ? (local.records || {})[question.id] : null;
	if (!record) return pracHasAnswer(question, (local.answers || {})[question.id]) ? 'answered' : 'empty';
	if (!record.revealed) return 'answered';
	if (record.correct === true) return 'correct';
	if (record.correct === false) return 'wrong';
	return 'pending';
}

/* ------------------------------------------------------------------ */
/* 每秒刷新一次，用于顶部用时显示                                       */
/* ------------------------------------------------------------------ */

function pracUseTick(active) {
	const state = React.useState(0);
	const bump = state[1];
	React.useEffect(
		function () {
			if (!active) return undefined;
			const timer = window.setInterval(function () {
				bump(function (value) {
					return value + 1;
				});
			}, 1000);
			return function () {
				window.clearInterval(timer);
			};
		},
		[active]
	);
	return state[0];
}

/* ------------------------------------------------------------------ */
/* 左侧固定图片面板：占比持久化 / 缩放范围                              */
/* ------------------------------------------------------------------ */

var PRACTICE_IMAGE_PANE_DEFAULT = 0.32;
var PRACTICE_IMAGE_PANE_MIN = 0.18;
var PRACTICE_IMAGE_PANE_MAX = 0.6;
var PRACTICE_IMAGE_PANE_STORAGE_KEY = 'practice-mode.imagePaneRatio';

function pracClampPaneRatio(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return PRACTICE_IMAGE_PANE_DEFAULT;
	return Math.min(PRACTICE_IMAGE_PANE_MAX, Math.max(PRACTICE_IMAGE_PANE_MIN, number));
}

function pracLoadPaneRatio() {
	try {
		const raw = window.localStorage.getItem(PRACTICE_IMAGE_PANE_STORAGE_KEY);
		if (raw === null || raw === '') return PRACTICE_IMAGE_PANE_DEFAULT;
		return pracClampPaneRatio(parseFloat(raw));
	} catch (error) {
		return PRACTICE_IMAGE_PANE_DEFAULT;
	}
}

function pracSavePaneRatio(value) {
	try {
		window.localStorage.setItem(PRACTICE_IMAGE_PANE_STORAGE_KEY, String(pracClampPaneRatio(value)));
	} catch (error) {
		/* localStorage 不可用时忽略，仅本次会话生效 */
	}
}

/* 图片固定键：courseId + relPath，同一张图只能固定一次。 */
function pracFigurePinKey(courseId, relPath) {
	return String(courseId || '') + '|' + String(relPath || '');
}

/* ------------------------------------------------------------------ */
/* 题目字号缩放：80%~150%，持久化到 localStorage                        */
/* ------------------------------------------------------------------ */

var PRACTICE_FONT_SCALE_DEFAULT = 1;
var PRACTICE_FONT_SCALE_MIN = 0.8;
var PRACTICE_FONT_SCALE_MAX = 1.5;
var PRACTICE_FONT_SCALE_STEP = 0.1;
var PRACTICE_FONT_SCALE_STORAGE_KEY = 'practice-mode.questionFontScale';

function pracClampFontScale(value) {
	const number = Number(value);
	if (!Number.isFinite(number)) return PRACTICE_FONT_SCALE_DEFAULT;
	const clamped = Math.min(PRACTICE_FONT_SCALE_MAX, Math.max(PRACTICE_FONT_SCALE_MIN, number));
	return Math.round(clamped * 100) / 100;
}

function pracLoadFontScale() {
	try {
		const raw = window.localStorage.getItem(PRACTICE_FONT_SCALE_STORAGE_KEY);
		if (raw === null || raw === '') return PRACTICE_FONT_SCALE_DEFAULT;
		return pracClampFontScale(parseFloat(raw));
	} catch (error) {
		return PRACTICE_FONT_SCALE_DEFAULT;
	}
}

function pracSaveFontScale(value) {
	try {
		window.localStorage.setItem(PRACTICE_FONT_SCALE_STORAGE_KEY, String(pracClampFontScale(value)));
	} catch (error) {
		/* localStorage 不可用时忽略，仅本次会话生效 */
	}
}

/* 左侧固定图片面板：标题 + 关闭、缩放控件（− / 百分比 / + / 重置）、可滚动画布。
 * 图片使用「基准宽度 × zoom」的显式像素宽高（按 naturalWidth/naturalHeight 保持比例），
 * 这样放大后画布高度/宽度都会真实增长，滚动容器横纵两个方向都能滚动。 */
function PracticeImagePane(props) {
	const figure = props.figure || {};
	const figureKey = figure.key || '';
	const zoomState = React.useState(1);
	const zoom = zoomState[0];
	const setZoom = zoomState[1];
	const failedState = React.useState(false);
	const failed = failedState[0];
	const setFailed = failedState[1];
	const baseWidthState = React.useState(0);
	const baseWidth = baseWidthState[0];
	const setBaseWidth = baseWidthState[1];
	const naturalState = React.useState(null);
	const natural = naturalState[0];
	const setNatural = naturalState[1];
	const scrollRef = React.useRef(null);

	React.useEffect(
		function () {
			setZoom(1);
			setFailed(false);
			setNatural(null);
		},
		[figureKey]
	);

	/* 基准宽度 = 滚动容器可视宽度 - 画布左右 padding(10*2)。 */
	function measureBaseWidth() {
		const element = scrollRef.current;
		const width = element && element.clientWidth ? element.clientWidth : 0;
		if (width > 0) setBaseWidth(Math.max(80, width - 20));
	}

	/* 分隔条拖动（widthPct 变化）/窗口变化时重新测量基准宽度。 */
	React.useEffect(
		function () {
			measureBaseWidth();
		},
		[figureKey, props.widthPct]
	);

	React.useEffect(
		function () {
			measureBaseWidth();
			let observer = null;
			const target = scrollRef.current;
			if (target && typeof window.ResizeObserver === 'function') {
				try {
					observer = new window.ResizeObserver(function () {
						measureBaseWidth();
					});
					observer.observe(target);
				} catch (error) {
					observer = null;
				}
			}
			window.addEventListener('resize', measureBaseWidth);
			return function () {
				window.removeEventListener('resize', measureBaseWidth);
				if (observer) {
					try {
						observer.disconnect();
					} catch (error) {
						/* ResizeObserver 清理失败不影响功能 */
					}
				}
			};
		},
		[figureKey]
	);

	const src = figure.relPath ? DSP.assetUrl(figure.courseId, figure.relPath) : '';
	const alt = figure.alt || DSP.t('图片');
	const percent = Math.round(zoom * 100);
	const naturalWidth = natural && natural.width > 0 ? natural.width : 0;
	const naturalHeight = natural && natural.height > 0 ? natural.height : 0;
	const aspect = naturalWidth > 0 && naturalHeight > 0 ? naturalHeight / naturalWidth : 0.72;
	const imageWidth = baseWidth > 0 ? Math.max(1, Math.round(baseWidth * zoom)) : 0;
	const imageHeight = imageWidth > 0 ? Math.max(1, Math.round(imageWidth * aspect)) : 0;
	const imageStyle = imageWidth > 0 ? { width: imageWidth + 'px', height: imageHeight + 'px' } : { width: '100%', height: 'auto' };

	function changeZoom(delta) {
		setZoom(function (value) {
			return Math.min(4, Math.max(0.25, Math.round((value + delta) * 100) / 100));
		});
	}

	return h(
		'aside',
		{ className: 'dsp-practice-image-pane', style: { flexBasis: Math.max(0, Number(props.widthPct) || 32) + '%' }, 'aria-label': '固定图片' },
		h(
			'div',
			{ className: 'dsp-practice-image-pane-head' },
			h('span', { className: 'dsp-practice-image-pane-title dsp-truncate', title: alt }, alt),
			h(DSP.IconBtn, { icon: 'x', label: DSP.t('关闭'), title: '取消固定图片', onClick: props.onClose })
		),
		h(
			'div',
			{ className: 'dsp-practice-image-pane-zoom' },
			h(DSP.Btn, { variant: 'ghost', icon: 'minus', title: '缩小', disabled: zoom <= 0.25, onClick: function () { changeZoom(-0.25); } }),
			h('span', { className: 'dsp-practice-image-pane-percent' }, percent + '%'),
			h(DSP.Btn, { variant: 'ghost', icon: 'plus', title: '放大', disabled: zoom >= 4, onClick: function () { changeZoom(0.25); } }),
			h(
				DSP.Btn,
				{
					variant: 'ghost',
					className: 'dsp-practice-image-pane-reset',
					title: '重置缩放',
					disabled: zoom === 1,
					onClick: function () {
						setZoom(1);
					}
				},
				'重置'
			)
		),
		h(
			'div',
			{ className: 'dsp-practice-image-pane-scroll', ref: scrollRef },
			src && !failed
				? h(
						'div',
						{ className: 'dsp-practice-image-pane-canvas' },
						h('img', {
							className: 'dsp-practice-image-pane-img',
							src: src,
							alt: alt,
							style: imageStyle,
							onLoad: function (event) {
								const element = event && event.target;
								if (element && element.naturalWidth > 0 && element.naturalHeight > 0) {
									setNatural({ width: element.naturalWidth, height: element.naturalHeight });
								}
							},
							onError: function () {
								setFailed(true);
							}
						})
				  )
				: h(
						'div',
						{ className: 'dsp-practice-image-pane-empty' },
						h(DSP.Icon, { name: 'image', size: 22 }),
						h('span', null, failed ? '图片加载失败' : '暂无图片')
				  )
		)
	);
}

/* ------------------------------------------------------------------ */
/* PracticeArea：刷题区根组件                                           */
/* ------------------------------------------------------------------ */

function PracticeArea() {
	const selection = DSP.useStore(function (value) {
		const uiValue = value.ui || {};
		const courseValue =
			(value.data.courses || []).find(function (course) {
				return course.id === uiValue.courseId;
			}) || null;
		const cacheValue = uiValue.setId ? (value.setCache || {})[uiValue.setId] || null : null;
		return { ui: uiValue, course: courseValue, cache: cacheValue, capabilities: value.data.capabilities || null };
	});

	const ui = selection.ui;
	const course = selection.course;
	const cache = selection.cache;
	const capabilities = selection.capabilities || {};
	const courseId = ui.courseId || null;
	const setId = ui.setId || null;
	const parse = ui.parse || null;
	const svgJob = ui.svgJob || null;
	const setSummary =
		course && setId
			? (course.sets || []).find(function (item) {
					return item.id === setId;
			  }) || null
			: null;

	/* 本地刷新器：本地作答状态不是 React state，改完手动 bump。 */
	const bumpState = React.useState(0);
	const bumpLocal = bumpState[1];
	const refresh = React.useCallback(function () {
		bumpLocal(function (value) {
			return value + 1;
		});
	}, []);

	/* 左侧固定图片面板：同一时间固定一张，占比存 localStorage。 */
	const pinState = React.useState(null);
	const pinnedFigure = pinState[0];
	const setPinnedFigure = pinState[1];
	const ratioState = React.useState(pracLoadPaneRatio);
	const paneRatio = ratioState[0];
	const setPaneRatio = ratioState[1];
	const paneRatioRef = React.useRef(paneRatio);
	paneRatioRef.current = paneRatio;
	const splitRef = React.useRef(null);

	/* 题目字号缩放（顶部条 A− / 百分比 / A+ / 重置），持久化到 localStorage。 */
	const fontScaleState = React.useState(pracLoadFontScale);
	const fontScale = fontScaleState[0];
	const setFontScaleState = fontScaleState[1];

	function changeFontScale(next) {
		const value = pracClampFontScale(next);
		setFontScaleState(value);
		pracSaveFontScale(value);
	}

	React.useEffect(
		function () {
			setPinnedFigure(null);
		},
		[courseId, setId]
	);

	/* 结果页在 completeSet invalidateSet 之后仍需要题目数据，这里保留一份快照。 */
	const snapshotRef = React.useRef(null);
	const cachedSet = cache && cache.data ? cache.data : null;
	if (cachedSet) snapshotRef.current = { id: setId, data: cachedSet };
	const snapshot = snapshotRef.current;
	const setData = cachedSet || (snapshot && snapshot.id === setId ? snapshot.data : null);

	/* 挂载 / setId 变化时加载 set.json；缓存被失效（例如重绘、交卷）后自动补加载。 */
	React.useEffect(
		function () {
			if (courseId && setId) {
				DSP.store.actions.loadSet(courseId, setId).catch(function () {});
			}
		},
		[courseId, setId]
	);
	const needsLoad = Boolean(courseId && setId && (!cache || (!cache.loading && !cache.data && !cache.error)));
	React.useEffect(
		function () {
			if (needsLoad && courseId && setId) {
				DSP.store.actions.loadSet(courseId, setId).catch(function () {});
			}
		},
		[needsLoad, courseId, setId]
	);

	function handleMouseUp(event) {
		if (typeof DSP.handlePracticeSelection !== 'function') return;
		try {
			DSP.handlePracticeSelection(event);
		} catch (error) {
			/* 框选提问异常不应中断练习 */
		}
	}

	function goToCourse() {
		if (courseId) DSP.store.actions.openCourse(courseId);
		else DSP.store.actions.openGlobalDash();
	}

	function restartPractice() {
		pracRestartLocal(setId);
		DSP.store.actions.ui({ questionIndex: 0 });
		refresh();
	}

	function retryParse() {
		if (!courseId || !setId) return;
		DSP.store.actions.startParse(courseId, setId).catch(pracToastError);
	}

	/* 点击题图/材料图：未固定 → 固定到左侧；点同一张 → 取消固定。 */
	function handleTogglePinFigure(figure) {
		if (!figure || !figure.relPath) return;
		const key = pracFigurePinKey(figure.courseId || courseId, figure.relPath);
		setPinnedFigure(function (previous) {
			if (previous && previous.key === key) return null;
			return {
				key: key,
				courseId: figure.courseId || courseId,
				relPath: String(figure.relPath),
				alt: figure.alt ? String(figure.alt) : ''
			};
		});
	}

	function closePinnedFigure() {
		setPinnedFigure(null);
	}

	/* 拖动分隔条调整左侧图片区占比（18%~60%），松手后写入 localStorage。 */
	function handleSplitterMouseDown(event) {
		if (!splitRef.current) return;
		event.preventDefault();
		const rect = splitRef.current.getBoundingClientRect();
		if (!rect || rect.width <= 0) return;
		let latest = paneRatioRef.current;
		function onMove(moveEvent) {
			latest = pracClampPaneRatio((moveEvent.clientX - rect.left) / rect.width);
			paneRatioRef.current = latest;
			setPaneRatio(latest);
		}
		function onUp() {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
			pracSavePaneRatio(latest);
		}
		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	let content = null;
	let practiceBodyVisible = false;

	if (!courseId || !setId) {
		content = h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h(
					DSP.Empty,
					{
						icon: 'list',
						title: DSP.t('无题目'),
						action: h(DSP.Btn, { variant: 'primary', icon: 'arrowLeft', onClick: goToCourse }, DSP.t('返回课程'))
					},
					'请先从课程主页选择一套题开始练习。'
				)
			)
		);
	} else if (parse && parse.setId === setId) {
		content = h(PracticeParseCard, {
			parse: parse,
			capabilities: capabilities,
			onBack: goToCourse,
			onRetry: retryParse
		});
	} else if (!course) {
		content = h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h('div', { className: 'dsp-practice-center' },
					h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' }, h(DSP.Spinner, { size: 18 }), h('span', null, DSP.t('正在加载')))
				)
			)
		);
	} else if (!setData) {
		if (cache && cache.error) {
			content = h(PracticeSetError, {
				error: cache.error,
				capabilities: capabilities,
				onBack: goToCourse,
				onRetry: function () {
					DSP.store.actions.invalidateSet(setId);
					DSP.store.actions.loadSet(courseId, setId).catch(pracToastError);
				},
				onParse: retryParse
			});
		} else {
			content = h(
				'div',
				{ className: 'dsp-practice-scroll' },
				h(
					'div',
					{ className: 'dsp-practice-inner' },
					h(
						'div',
						{ className: 'dsp-practice-center' },
						h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' },
							h(DSP.Spinner, { size: 18 }),
							h('span', null, DSP.t('正在加载') + ' ' + DSP.t('题目') + '…')
						)
					)
				)
			);
		}
	} else if (!Array.isArray(setData.questions) || setData.questions.length === 0) {
		/* 解析完成但没有题目：提示重新解析 / 返回课程。 */
		content = h(PracticeSetEmpty, {
			setData: setData,
			setSummary: setSummary,
			capabilities: capabilities,
			onBack: goToCourse,
			onParse: retryParse
		});
	} else {
		const questions = setData.questions;
		const local = pracEnsureLocal(course.records || [], setId, setSummary);
		const mode = pracEffectiveMode(local, ui, setSummary);
		const completed = Boolean(local.finished);
		const started = !completed && (Object.keys(local.records || {}).length > 0 || local.startedAt !== null);
		if (completed) {
			content = h(PracticeResultPage, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				mode: mode,
				refresh: refresh,
				onRestart: restartPractice,
				onBack: goToCourse
			});
		} else if (!started) {
			content = h(PracticeModeSelect, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				capabilities: capabilities,
				refresh: refresh,
				onBack: goToCourse
			});
		} else {
			practiceBodyVisible = true;
			content = h(PracticeBody, {
				courseId: courseId,
				setId: setId,
				course: course,
				setSummary: setSummary,
				setData: setData,
				local: local,
				mode: mode,
				capabilities: capabilities,
				svgJob: svgJob,
				initialIndex: ui.questionIndex,
				refresh: refresh,
				onBack: goToCourse,
				pinnedFigureKey: pinnedFigure ? pinnedFigure.key : null,
				onPinFigure: handleTogglePinFigure,
				fontScale: fontScale,
				onFontScaleChange: changeFontScale
			});
		}
	}

	const showImagePane = Boolean(pinnedFigure && practiceBodyVisible && pinnedFigure.courseId === courseId);
	/* 布局树保持稳定：无论是否固定图片，内容都渲染在 .dsp-practice-split-main 中，
	 * 避免固定/取消时 PracticeBody 重新挂载导致题目内原图闪烁或缺失。 */
	const rendered = h(
		'div',
		{ className: 'dsp-practice-split', ref: splitRef },
		showImagePane
			? h(PracticeImagePane, {
					key: 'image-pane',
					figure: pinnedFigure,
					widthPct: paneRatio * 100,
					onClose: closePinnedFigure
			  })
			: null,
		showImagePane
			? h('div', {
					key: 'image-splitter',
					className: 'dsp-practice-splitter',
					role: 'separator',
					'aria-orientation': 'vertical',
					'aria-label': '调整图片区域宽度',
					'aria-valuemin': 18,
					'aria-valuemax': 60,
					'aria-valuenow': Math.round(paneRatio * 100),
					tabIndex: 0,
					title: '拖动调整图片区域宽度（←/→ 微调）',
					onMouseDown: handleSplitterMouseDown,
					onKeyDown: function (event) {
						if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
						event.preventDefault();
						const next = pracClampPaneRatio(paneRatioRef.current + (event.key === 'ArrowLeft' ? -0.02 : 0.02));
						paneRatioRef.current = next;
						setPaneRatio(next);
						pracSavePaneRatio(next);
					}
			  })
			: null,
		h('div', { key: 'practice-main', className: 'dsp-practice-split-main' }, content)
	);

	return h(
		'div',
		{
			className: 'dsp-practice',
			onMouseUp: handleMouseUp,
			style: { '--dsp-question-font-scale': String(fontScale) }
		},
		rendered
	);
}

/* ------------------------------------------------------------------ */
/* 能力提示 / 解析进度卡 / 加载错误 / 空态                             */
/* ------------------------------------------------------------------ */

function PracticeCapabilityHint(props) {
	const state = React.useState(false);
	const dismissed = state[0];
	const setDismissed = state[1];
	const capabilities = props.capabilities || {};
	if (dismissed || capabilities.images !== false) return null;
	return h(
		'div',
		{ className: 'dsp-practice-banner' },
		h(DSP.Icon, { name: 'alert', size: 14 }),
		h(
			'span',
			{ className: 'dsp-practice-banner-text' },
			'当前模型不支持图片输入，扫描件/图片型题目可能无法解析；文本层完整的 PDF / Office / 文本题目不受影响。'
		),
		h(DSP.IconBtn, { icon: 'x', size: 13, label: DSP.t('关闭'), onClick: function () { setDismissed(true); } })
	);
}

function PracticeWarnings(props) {
	const warnings = (props.warnings || []).filter(function (warning) { return Boolean(warning); });
	const key = warnings.join('|');
	const hiddenState = React.useState(false);
	const hidden = hiddenState[0];
	const setHidden = hiddenState[1];
	React.useEffect(function () {
		if (warnings.length === 0) return undefined;
		setHidden(false);
		/* 解析提示只显示几秒，不长期占住顶部。 */
		const timer = window.setTimeout(function () { setHidden(true); }, 5000);
		return function () { window.clearTimeout(timer); };
	}, [key]);
	if (warnings.length === 0 || hidden) return null;
	return h(
		'div',
		{ className: 'dsp-practice-banner dsp-practice-banner-info' },
		h(DSP.Icon, { name: 'bulb', size: 14 }),
		h('span', { className: 'dsp-practice-banner-text' }, '解析提示：' + warnings.slice(0, 3).join('；'))
	);
}

function PracticeParseCard(props) {
	const parse = props.parse || {};
	const failed = parse.status === 'error';
	const running = !failed;
	const fraction = pracProgressFraction(parse.progress);
	const message = parse.message || (running ? DSP.t('正在解析') : DSP.t('解析失败'));
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-parse-card' },
					h(
						'div',
						{ className: 'dsp-parse-icon' + (failed ? ' dsp-parse-icon-error' : '') },
						failed ? h(DSP.Icon, { name: 'alert', size: 26 }) : h(DSP.Spinner, { size: 26 })
					),
					h('div', { className: 'dsp-parse-title' }, failed ? DSP.t('解析失败') : DSP.t('正在解析')),
					h('div', { className: 'dsp-parse-message dsp-muted' }, message),
					running
						? h(
								'div',
								{ className: 'dsp-parse-progress' },
								h(DSP.ProgressBar, { value: fraction }),
								h('div', { className: 'dsp-parse-progress-meta dsp-small dsp-muted' }, Math.round(fraction * 100) + '%')
						  )
						: null,
					failed && parse.error ? h('div', { className: 'dsp-parse-error dsp-small' }, String(parse.error)) : null,
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-parse-actions' },
						failed ? h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRetry }, DSP.t('重试')) : null,
						h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

function PracticeSetError(props) {
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-practice-notice' },
					h('div', { className: 'dsp-practice-notice-icon dsp-practice-notice-icon-error' }, h(DSP.Icon, { name: 'alert', size: 24 })),
					h('div', { className: 'dsp-practice-notice-title' }, '题目加载失败'),
					h('div', { className: 'dsp-practice-notice-text dsp-muted' }, String(props.error || '') || '未知错误'),
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-practice-notice-actions' },
						h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRetry }, DSP.t('重试')),
						h(DSP.Btn, { variant: 'secondary', icon: 'sparkles', onClick: props.onParse }, '重新解析'),
						h(DSP.Btn, { variant: 'ghost', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

function PracticeSetEmpty(props) {
	const setData = props.setData || {};
	const setSummary = props.setSummary || {};
	const status = setSummary.status || 'ready';
	const failed = status === 'failed';
	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner' },
			h(
				'div',
				{ className: 'dsp-practice-center' },
				h(
					'div',
					{ className: 'dsp-card dsp-practice-notice' },
					h('div', { className: 'dsp-practice-notice-icon' }, h(DSP.Icon, { name: 'list', size: 24 })),
					h('div', { className: 'dsp-practice-notice-title' }, failed ? DSP.t('解析失败') : DSP.t('无题目')),
					h(
						'div',
						{ className: 'dsp-practice-notice-text dsp-muted' },
						failed && setSummary.error ? String(setSummary.error) : '这套题还没有可练习的题目。请确认题目文件已上传并完成解析。'
					),
					Array.isArray(setData.warnings) && setData.warnings.length > 0 ? h(PracticeWarnings, { warnings: setData.warnings }) : null,
					h(PracticeCapabilityHint, { capabilities: props.capabilities }),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-practice-notice-actions' },
						h(DSP.Btn, { variant: 'primary', icon: 'sparkles', onClick: props.onParse }, '重新解析'),
						h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程'))
					)
				)
			)
		)
	);
}

/* ------------------------------------------------------------------ */
/* 模式选择卡                                                          */
/* ------------------------------------------------------------------ */

function PracticeModeSelect(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const summaryMode =
		props.setSummary && (props.setSummary.mode === PRACTICE_MODE_END || props.setSummary.mode === PRACTICE_MODE_IMMEDIATE) ? props.setSummary.mode : null;
	const defaultMode = summaryMode || props.local.mode || PRACTICE_MODE_IMMEDIATE;
	const modeState = React.useState(defaultMode === PRACTICE_MODE_END ? PRACTICE_MODE_END : PRACTICE_MODE_IMMEDIATE);
	const selectedMode = modeState[0];
	const setSelectedMode = modeState[1];

	const typeCounts = {};
	questions.forEach(function (question) {
		const type = (question && question.type) || 'other';
		typeCounts[type] = (typeCounts[type] || 0) + 1;
	});
	const typeSummary = Object.keys(typeCounts)
		.map(function (type) {
			return pracTypeLabel(type) + ' ' + typeCounts[type];
		})
		.join(' · ');

	function startPractice() {
		props.local.mode = selectedMode;
		props.local.startedAt = Date.now();
		props.local.finished = false;
		DSP.store.actions.setMode(props.courseId, props.setId, selectedMode).catch(pracToastError);
		props.refresh();
	}

	function renderModeCard(mode, icon, title, description) {
		const active = selectedMode === mode;
		return h(
			'button',
			{
				type: 'button',
				key: mode,
				className: DSP.cls('dsp-mode-card', active ? 'dsp-mode-card-active' : ''),
				onClick: function () {
					setSelectedMode(mode);
				},
				'aria-pressed': active
			},
			h('div', { className: 'dsp-mode-card-top' },
				h('span', { className: 'dsp-mode-card-icon' }, h(DSP.Icon, { name: icon, size: 20 })),
				active ? h(DSP.Icon, { name: 'checkCircle', size: 17, className: 'dsp-mode-card-check' }) : null
			),
			h('div', { className: 'dsp-mode-card-title' }, title),
			h('div', { className: 'dsp-mode-card-desc' }, description)
		);
	}

	return h(
		'div',
		{ className: 'dsp-practice-scroll' },
		h(
			'div',
			{ className: 'dsp-practice-inner dsp-mode-select' },
			h(
				'div',
				{ className: 'dsp-mode-head' },
				h(DSP.IconBtn, { icon: 'arrowLeft', label: DSP.t('返回课程'), onClick: props.onBack }),
				h(
					'div',
					{ className: 'dsp-col dsp-gap-4 dsp-mode-head-text' },
					h('h1', { className: 'dsp-page-title' }, (props.setData && props.setData.title) || (props.setSummary && props.setSummary.title) || DSP.t('题目集')),
					h(
						'div',
						{ className: 'dsp-page-sub' },
						(props.course && props.course.name ? props.course.name + ' · ' : '') + questions.length + ' 道题' + (typeSummary ? ' · ' + typeSummary : '')
					)
				)
			),
			h(PracticeCapabilityHint, { capabilities: props.capabilities }),
			h(
				'div',
				{ className: 'dsp-mode-grid' },
				renderModeCard(PRACTICE_MODE_IMMEDIATE, 'play', DSP.t('答一题看一题'), '每提交一题立即显示答案与解析，适合边练边学、及时纠错。'),
				renderModeCard(PRACTICE_MODE_END, 'clock', DSP.t('全部做完再看'), '逐题作答，交卷后统一查看答案解析，适合模拟考试。')
			),
			h(
				'div',
				{ className: 'dsp-mode-actions' },
				h(DSP.Btn, { variant: 'primary', className: 'dsp-btn-lg', icon: 'play', onClick: startPractice }, DSP.t('开始刷题'))
			)
		)
	);
}

/* ------------------------------------------------------------------ */
/* 顶部条 / 题号导航 / 底部按钮                                        */
/* ------------------------------------------------------------------ */

function PracticeTopBar(props) {
	const accuracyText = props.accuracy === null || props.accuracy === undefined ? '—' : DSP.fmtPct(props.accuracy);
	const fontScale = typeof props.fontScale === 'number' ? props.fontScale : 1;
	const fontPercent = Math.round(fontScale * 100);
	function changeFontScale(next) {
		if (typeof props.onFontScaleChange === 'function') props.onFontScaleChange(next);
	}
	return h(
		'div',
		{ className: 'dsp-practice-top' },
		h(
			'div',
			{ className: 'dsp-practice-head' },
			h(
				'div',
				{ className: 'dsp-practice-head-main' },
				h(DSP.IconBtn, { icon: 'arrowLeft', label: DSP.t('返回课程'), onClick: props.onBack }),
				h(
					'div',
					{ className: 'dsp-practice-head-titles' },
					h('div', { className: 'dsp-practice-title dsp-truncate' }, props.title),
					h('div', { className: 'dsp-practice-sub dsp-truncate' }, props.courseName || '')
				)
			),
			h(
				'div',
				{ className: 'dsp-practice-head-meta' },
				h(DSP.Tag, { tone: 'brand' }, props.modeLabel),
				h('span', { className: 'dsp-practice-meta' }, '第 ' + (props.index + 1) + ' / ' + props.total + ' 题'),
				h('span', { className: 'dsp-practice-meta' }, DSP.t('已答') + ' ' + props.answered + '/' + props.total),
				h('span', { className: 'dsp-practice-meta' }, DSP.t('正确率') + ' ' + accuracyText),
				h('span', { className: 'dsp-practice-meta dsp-practice-clock' }, h(DSP.Icon, { name: 'clock', size: 13 }), props.elapsedText),
				h(
					'div',
					{ className: 'dsp-practice-font-scale', role: 'group', 'aria-label': '题目字号' },
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '缩小题目字号',
							disabled: fontScale <= 0.8,
							onClick: function () {
								changeFontScale(fontScale - 0.1);
							}
						},
						'A−'
					),
					h('span', { className: 'dsp-practice-font-scale-percent' }, fontPercent + '%'),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '放大题目字号',
							disabled: fontScale >= 1.5,
							onClick: function () {
								changeFontScale(fontScale + 0.1);
							}
						},
						'A+'
					),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							className: 'dsp-font-scale-btn',
							title: '重置题目字号',
							disabled: Math.abs(fontScale - 1) < 0.001,
							onClick: function () {
								changeFontScale(1);
							}
						},
						'重置'
					)
				)
			)
		),
		h('div', { className: 'dsp-practice-head-progress' }, h(DSP.ProgressBar, { value: props.total > 0 ? props.answered / props.total : 0 }))
	);
}

function PracticeQuestionNav(props) {
	const questions = props.questions || [];
	if (questions.length <= 1) return null;
	return h(
		'div',
		{ className: 'dsp-practice-nav', role: 'tablist', 'aria-label': '题号导航' },
		questions.map(function (question, index) {
			const state = pracQuestionNavState(question, props.local, props.currentIndex, index);
			const number = pracQuestionNumber(question, index);
			const record = question ? props.local.records[question.id] : null;
			let title = '第 ' + number + ' 题';
			if (record && record.revealed) {
				if (record.correct === true) title += ' · 正确';
				else if (record.correct === false) title += ' · 错误';
				else title += ' · 待自评';
			} else if (record) title += ' · 已作答';
			return h(
				'button',
				{
					key: question && question.id ? question.id : 'q' + index,
					type: 'button',
					role: 'tab',
					'aria-selected': index === props.currentIndex,
					className: DSP.cls('dsp-practice-nav-item', 'dsp-practice-nav-item-' + state),
					title: title,
					onClick: function () {
						props.onJump(index);
					}
				},
				number
			);
		})
	);
}

function PracticeFooter(props) {
	const isLast = props.index >= props.total - 1;
	const submitLabel = props.mode === PRACTICE_MODE_END ? (props.submitted ? '更新答案' : DSP.t('提交')) : props.submitting ? 'AI 批改中…' : 'AI 判题';
	const resetButton = props.revealed && typeof props.onReset === 'function'
		? h(
				DSP.Btn,
				{ variant: 'secondary', icon: 'refresh', disabled: props.submitting, onClick: props.onReset },
				'重新作答'
		  )
		: null;
	let primaryAction = null;
	if (!props.revealed) {
		primaryAction = h(
			DSP.Btn,
			{
				variant: 'primary',
				icon: 'check',
				loading: props.submitting,
				disabled: props.submitting || !props.canSubmit,
				onClick: props.onSubmit
			},
			submitLabel
		);
	} else if (isLast) {
		primaryAction = h(DSP.Btn, { variant: 'primary', icon: 'flag', disabled: props.submitting, onClick: props.onFinish }, DSP.t('交卷'));
	} else {
		primaryAction = h(DSP.Btn, { variant: 'primary', icon: 'chevronRight', onClick: props.onNext }, DSP.t('下一题'));
	}
	const showFinish = !props.revealed || !isLast;
	return h(
		'div',
		{ className: 'dsp-practice-foot' },
		h(
			'div',
			{ className: 'dsp-practice-foot-left' },
			h(DSP.Btn, { variant: 'secondary', icon: 'chevronLeft', disabled: props.index <= 0, onClick: props.onPrev }, DSP.t('上一题')),
			h(DSP.Btn, { variant: 'secondary', disabled: isLast, onClick: props.onNext }, DSP.t('下一题'))
		),
		h(
			'div',
			{ className: 'dsp-practice-foot-right' },
			resetButton,
			primaryAction,
			showFinish ? h(DSP.Btn, { variant: 'ghost', icon: 'flag', disabled: props.submitting, onClick: props.onFinish }, DSP.t('交卷')) : null
		)
	);
}

/* ------------------------------------------------------------------ */
/* 练习主体                                                            */
/* ------------------------------------------------------------------ */

function PracticeBody(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const total = questions.length;
	const initialIndex = pracClampIndex(props.initialIndex, total);
	const indexState = React.useState(initialIndex);
	const storedIndex = indexState[0];
	const storeIndex = indexState[1];
	const currentIndex = Math.min(storedIndex, Math.max(0, total - 1));
	const question = questions[currentIndex] || null;

	const bumpState = React.useState(0);
	const bumpLocal = bumpState[1];
	const refreshLocal = React.useCallback(function () {
		bumpLocal(function (value) {
			return value + 1;
		});
	}, []);

	const [submitting, setSubmitting] = React.useState(false);
	const [finishOpen, setFinishOpen] = React.useState(false);
	const [finishing, setFinishing] = React.useState(false);
	const [gradingProgress, setGradingProgress] = React.useState(null); // {done,total}

	/* 当前题号写回全局，看板可据此定位。 */
	React.useEffect(
		function () {
			const storeState = DSP.store.get();
			if (storeState.ui.questionIndex !== currentIndex) DSP.store.actions.ui({ questionIndex: currentIndex });
		},
		[currentIndex]
	);

	/* 外部（看板「定位错题」等）修改 questionIndex 时跟随跳转。 */
	const externalIndex = pracClampIndex(props.initialIndex, total);
	const externalIndexRef = React.useRef(externalIndex);
	React.useEffect(
		function () {
			if (externalIndex !== externalIndexRef.current) {
				externalIndexRef.current = externalIndex;
				storeIndex(externalIndex);
			}
		},
		[externalIndex]
	);

	const scrollRef = React.useRef(null);
	React.useEffect(
		function () {
			if (scrollRef.current) scrollRef.current.scrollTop = 0;
		},
		[currentIndex, props.setId]
	);

	const questionStartRef = React.useRef(Date.now());
	React.useEffect(
		function () {
			questionStartRef.current = Date.now();
		},
		[currentIndex, props.setId]
	);

	pracUseTick(!props.local.finished);
	const stats = pracSetStats(questions, props.local);
	const elapsedMs = props.local.startedAt ? Math.max(0, Date.now() - props.local.startedAt) : 0;
	const mode = props.mode || PRACTICE_MODE_IMMEDIATE;
	const currentRecord = question ? props.local.records[question.id] : null;
	const revealed = question ? Boolean(props.local.revealed[question.id]) : false;
	const canSubmit = question ? pracHasAnswer(question, props.local.answers[question.id]) : false;

	function setIndex(nextIndex) {
		const value = pracClampIndex(nextIndex, total);
		if (value !== currentIndex) storeIndex(value);
	}

	function handleAnswerChange(value) {
		if (!question) return;
		props.local.answers[question.id] = value;
		/* 答案改过就作废旧判题缓存，重新提交时才会重新判卷。 */
		delete props.local.grades[question.id];
		const existing = props.local.records[question.id];
		if (existing && existing.aiGrade) {
			const next = Object.assign({}, existing);
			delete next.aiGrade;
			props.local.records[question.id] = next;
		}
		if (props.local.startedAt === null) props.local.startedAt = Date.now();
		refreshLocal();
	}

	/** 重新作答：清掉本题的 reveal/判题缓存，回到可编辑状态；再次提交会重新判卷。 */
	function handleResetAnswer() {
		if (!question) return;
		props.local.revealed[question.id] = false;
		delete props.local.grades[question.id];
		const record = props.local.records[question.id];
		if (record) {
			const next = Object.assign({}, record, { revealed: false, correct: null, selfGraded: false });
			delete next.aiGrade;
			props.local.records[question.id] = next;
		}
		refreshLocal();
	}

	function createBaseRecord(questionItem, value) {
		const previous = props.local.records[questionItem.id];
		const elapsed = Math.max(0, Date.now() - questionStartRef.current);
		return {
			id: (previous && previous.id) || props.local.recordIds[questionItem.id] || DSP.uid('r'),
			questionId: questionItem.id,
			answer: pracNormalizeWrite(questionItem, value),
			correct: pracEvaluate(questionItem, value).correct,
			revealed: false,
			durationMs: previous && Number.isFinite(Number(previous.durationMs)) ? Math.max(0, Number(previous.durationMs)) : elapsed,
			mode: mode,
			selfGraded: false
		};
	}

	/* 启动一次 AI 批改：同一题只调用一次；失败回退本地对比判分并 toast。
	 * 返回 Promise<record>（correct 已按 AI verdict 或本地回退确定，成功时带 aiGrade）。 */
	function startAiGrade(questionItem, baseRecord) {
		const cached = props.local.grades[questionItem.id];
		if (cached && cached.promise) return cached.promise;
		if (cached && cached.record) return Promise.resolve(cached.record);
		if (baseRecord && baseRecord.aiGrade) return Promise.resolve(baseRecord);
		const answerSnapshot = pracToArray(baseRecord && baseRecord.answer);
		const promise = Promise.resolve()
			.then(function () {
				return DSP.store.actions.gradeQuestion(questionItem.id, answerSnapshot);
			})
			.then(function (aiGrade) {
				const current = props.local.records[questionItem.id] || baseRecord;
				const currentAnswer = pracToArray(current.answer);
				const sameAnswer =
					currentAnswer.length === answerSnapshot.length &&
					currentAnswer.every(function (item, index) {
						return String(item) === String(answerSnapshot[index]);
					});
				const verdictCorrect = pracAiGradeCorrect(aiGrade);
				const next = Object.assign({}, current, {
					correct: verdictCorrect === null ? pracEvaluate(questionItem, current.answer).correct : verdictCorrect
				});
				/* 用户在批改期间改过答案则丢弃该次 AI 结果，仅保留本地兜底判分。 */
				if (sameAnswer) next.aiGrade = aiGrade && typeof aiGrade === 'object' ? aiGrade : {};
				props.local.records[questionItem.id] = next;
				props.local.recordIds[questionItem.id] = next.id;
				props.local.grades[questionItem.id] = { status: sameAnswer ? 'done' : 'stale', record: next };
				refreshLocal();
				return next;
			})
			.catch(function (error) {
				pracToastError(error);
				const current = Object.assign({}, props.local.records[questionItem.id] || baseRecord, {
					correct: pracEvaluate(questionItem, (props.local.records[questionItem.id] || baseRecord).answer).correct
				});
				props.local.records[questionItem.id] = current;
				props.local.grades[questionItem.id] = { status: 'error', record: current };
				refreshLocal();
				return current;
			});
		props.local.grades[questionItem.id] = { status: 'running', promise: promise };
		return promise;
	}

	function handleSubmit() {
		if (submitting || !question) return;
		const value = props.local.answers[question.id];
		if (!pracHasAnswer(question, value)) {
			DSP.store.actions.toast('这道题还没有作答', 'warn');
			return;
		}
		const baseRecord = createBaseRecord(question, value);
		props.local.records[question.id] = Object.assign({}, baseRecord, { revealed: false });
		props.local.recordIds[question.id] = baseRecord.id;
		props.local.answers[question.id] = pracToArray(value);
		if (props.local.startedAt === null) props.local.startedAt = Date.now();
		refreshLocal();

		if (mode === PRACTICE_MODE_IMMEDIATE) {
			/* 即时模式：先 AI 批改（loading），再保存 record（含 aiGrade），最后 reveal。 */
			setSubmitting(true);
			startAiGrade(question, baseRecord)
				.then(function (graded) {
					const record = Object.assign({}, props.local.records[question.id] || graded || baseRecord, graded || {}, {
						revealed: true,
						selfGraded: false
					});
					return DSP.store.actions
						.saveRecords(props.courseId, props.setId, [record])
						.catch(pracToastError)
						.then(function () {
							props.local.records[question.id] = record;
							props.local.recordIds[question.id] = record.id;
							props.local.revealed[question.id] = true;
							refreshLocal();
						});
				})
				.then(function () {
					setSubmitting(false);
				});
			return;
		}

		/* 全部做完模式：后台批改，不阻塞继续做题；交卷时统一等待并写 records。 */
		startAiGrade(question, baseRecord);
		if (currentIndex < total - 1) setIndex(currentIndex + 1);
	}

	function handleSelfGrade(questionId, correct) {
		const record = props.local.records[questionId];
		if (!record) return;
		const next = Object.assign({}, record, { correct: Boolean(correct), selfGraded: true, revealed: true });
		props.local.records[questionId] = next;
		props.local.revealed[questionId] = true;
		refreshLocal();
		Promise.resolve(DSP.store.actions.saveRecords(props.courseId, props.setId, [next])).catch(pracToastError);
	}

	function handleAsk() {
		if (question) DSP.store.actions.askQuestion(question);
	}

	function handleRedrawFigure(questionId, figureIndex) {
		if (!questionId) return;
		DSP.store.actions.redrawFigure(props.setId, questionId, figureIndex).catch(pracToastError);
	}

	function handleNext() {
		setIndex(currentIndex + 1);
		questionStartRef.current = Date.now();
	}

	function handlePrev() {
		setIndex(currentIndex - 1);
		questionStartRef.current = Date.now();
	}

	function handleJump(index) {
		setIndex(index);
		questionStartRef.current = Date.now();
	}

	function handleFinish() {
		if (finishing) return;
		setFinishing(true);
		(async function () {
			/* 先等待所有「后台 AI 批改」完成并显示 x/y 进度，再统一写 records。 */
			const pending = [];
			questions.forEach(function (item) {
				const grade = props.local.grades[item.id];
				if (grade && grade.status === 'running' && grade.promise) pending.push(grade.promise);
			});
			if (pending.length > 0) {
				let done = 0;
				setGradingProgress({ done: 0, total: pending.length });
				/* 单题兜底：批改失败/超时都允许交卷继续（超时 90s，回退本地判分结果）。 */
				const waitOne = function (promise) {
					return new Promise(function (resolve) {
						let settled = false;
						const timer = window.setTimeout(function () {
							if (settled) return;
							settled = true;
							resolve(null);
						}, 90000);
						Promise.resolve(promise).then(
							function (value) {
								if (settled) return;
								settled = true;
								window.clearTimeout(timer);
								resolve(value);
							},
							function () {
								if (settled) return;
								settled = true;
								window.clearTimeout(timer);
								resolve(null);
							}
						);
					});
				};
				await Promise.all(
					pending.map(function (promise) {
						return waitOne(promise).then(function (value) {
							done += 1;
							setGradingProgress({ done: done, total: pending.length });
							return value;
						});
					})
				);
			}
			setGradingProgress(null);
			const batch = [];
			questions.forEach(function (item) {
				const record = props.local.records[item.id];
				if (!record) return;
				batch.push(Object.assign({}, record, { revealed: true }));
			});
			if (batch.length > 0) await DSP.store.actions.saveRecords(props.courseId, props.setId, batch);
			await DSP.store.actions.completeSet(props.courseId, props.setId);
			if (props.local.startedAt === null) props.local.startedAt = Date.now();
			if (!props.local.finished) props.local.finished = true;
			questions.forEach(function (item) {
				const record = props.local.records[item.id];
				if (!record) return;
				props.local.records[item.id] = Object.assign({}, record, { revealed: true });
				props.local.revealed[item.id] = true;
			});
			setFinishOpen(false);
			refreshLocal();
			DSP.store.actions.toast(DSP.t('完成') + '：' + (props.setData.title || '本套题'), 'success');
		})()
			.catch(pracToastError)
			.then(function () {
				setFinishing(false);
				setGradingProgress(null);
			});
	}

	const warnings = (props.setData && props.setData.warnings) || [];

	return h(
		'div',
		{ className: 'dsp-practice-panel' },
		h(PracticeTopBar, {
			title: (props.setData && (props.setData.title || props.setSummary && props.setSummary.title)) || DSP.t('题目集'),
			courseName: (props.course && props.course.name) || '',
			index: currentIndex,
			total: total,
			answered: stats.answered,
			accuracy: stats.accuracy,
			modeLabel: pracModeLabel(mode),
			elapsedText: props.local.startedAt ? DSP.fmtDuration(elapsedMs) : '—',
			fontScale: typeof props.fontScale === 'number' ? props.fontScale : 1,
			onFontScaleChange: props.onFontScaleChange,
			onBack: props.onBack
		}),
		h(
			'div',
			{ className: 'dsp-practice-scroll', ref: scrollRef },
			h(
				'div',
				{ className: 'dsp-practice-inner' },
				h(PracticeCapabilityHint, { capabilities: props.capabilities }),
				h(PracticeWarnings, { warnings: warnings }),
				h(PracticeQuestionNav, {
					questions: questions,
					local: props.local,
					currentIndex: currentIndex,
					onJump: handleJump
				}),
				question
					? h(PracticeQuestionCard, {
							question: question,
							index: currentIndex,
							setData: props.setData,
							courseId: props.courseId,
							setId: props.setId,
							local: props.local,
							svgJob: props.svgJob,
							revealed: revealed,
							record: currentRecord,
							isLast: currentIndex >= total - 1,
							onChange: handleAnswerChange,
							onAsk: handleAsk,
							onSelfGrade: function (correct) {
								handleSelfGrade(question.id, correct);
							},
							onNext: handleNext,
							onRedrawFigure: handleRedrawFigure,
							aiGrade: currentRecord && currentRecord.aiGrade ? currentRecord.aiGrade : null,
							locked: submitting && mode === PRACTICE_MODE_IMMEDIATE,
							pinnedFigureKey: props.pinnedFigureKey,
							onPinFigure: props.onPinFigure
					  })
					: null
			)
		),
		h(PracticeFooter, {
			index: currentIndex,
			total: total,
			revealed: revealed,
			submitted: Boolean(currentRecord),
			canSubmit: canSubmit,
			submitting: submitting,
			mode: mode,
			onPrev: handlePrev,
			onNext: handleNext,
			onSubmit: handleSubmit,
			onReset: handleResetAnswer,
			onFinish: function () {
				setFinishOpen(true);
			}
		}),
		h(
			DSP.Modal,
			{
				open: finishOpen,
				title: DSP.t('交卷'),
				onClose: function () {
					if (!finishing) setFinishOpen(false);
				},
				footer: [
					h(
						DSP.Btn,
						{
							key: 'cancel',
							variant: 'secondary',
							disabled: finishing,
							onClick: function () {
								if (!finishing) setFinishOpen(false);
							}
						},
						DSP.t('取消')
					),
					h(
						DSP.Btn,
						{
							key: 'confirm',
							variant: 'primary',
							icon: 'flag',
							loading: finishing,
							disabled: finishing,
							onClick: handleFinish
						},
						DSP.t('确认')
					)
				]
			},
			h(
				'div',
				{ className: 'dsp-col dsp-gap-8' },
				gradingProgress
					? h(
							'div',
							{ className: 'dsp-col dsp-gap-6' },
							h('div', null, 'AI 批改中… ' + gradingProgress.done + ' / ' + gradingProgress.total),
							h(DSP.ProgressBar, { value: gradingProgress.total > 0 ? gradingProgress.done / gradingProgress.total : 0 }),
							h('div', { className: 'dsp-small dsp-muted' }, '正在等待本套题目完成 AI 批改，完成后自动保存并统计成绩。')
					  )
					: h('div', null, '确定要交卷吗？交卷后本套题会标记为已完成，并统计本套成绩。'),
				h('div', { className: 'dsp-small dsp-muted' }, '当前进度：已答 ' + stats.answered + ' / ' + total + ' 题，正确率 ' + (stats.accuracy === null ? '—' : DSP.fmtPct(stats.accuracy)) + '。'),
				stats.answered < total ? h('div', { className: 'dsp-small dsp-muted' }, '还有 ' + (total - stats.answered) + ' 题未作答，未作答题目不计入正确率。') : null
			)
		)
	);
}

/* 供 90-app.js 的 ViewRouter 使用（ui.view === 'practice' 时渲染）。 */
DSP.PracticeArea = PracticeArea;

/* ==== src/client/41-practice-question.js ==== */
/* 刷题模式 Client — 刷题区题目渲染（practice-ui-dev 维护，40-practice.js 的相邻碎片）。
 *
 * 组件结构：
 *   PracticeQuestionCard   题目卡：题号 / 题型 / 难度 / 考点标签、共用材料、题干 markdown、题图、作答控件、解析区。
 *   PracticeMaterial       跨题共用材料（始终展开的固定区块，含材料内图片）。
 *   PracticeFigure         题图（DSP.assetUrl 取图；加载失败显示占位；旁边「重新绘制示图」按钮，
 *                          svgJob 进行中时按钮 loading，完成后由 store 刷新 set.json 替换图）。
 *   PracticeChoiceList     单选 / 多选 / 判断题的选项列表；reveal 后正确项 success、错选项 error。
 *   PracticeFillControl    填空题输入（按参考答案个数分空）；submit 后禁止编辑。
 *   PracticeTextControl    简答题 / 其他主观题 textarea。
 *   PracticeAnswerControl  按 question.type 分发到上面的控件。
 *   PracticeRevealPanel    reveal 后的答案 + 解析 + 一键提问 + 主观题自评 + 下一题。
 *
 * 富文本：题干/共用材料/解析用 DSP.markdown + `dsp-md-preserve`（保留连续空格/缩进）；
 * 选项、答案、用户作答等短文本用 DSP.inlineMarkdown（保留换行/空格/行内标记）；
 * 含 ``` fenced code block 的文本退回 DSP.markdown 以得到真正的代码块与横向滚动。
 */

/* ------------------------------------------------------------------ */
/* 富文本渲染小工具                                                    */
/* ------------------------------------------------------------------ */

function pracHasCodeFence(text) {
	if (text === undefined || text === null) return false;
	return String(text).indexOf('```') >= 0;
}

function pracInlineMarkdown(text) {
	const source = text === undefined || text === null ? '' : String(text);
	if (typeof DSP.inlineMarkdown === 'function') return DSP.inlineMarkdown(source);
	return source;
}

/* 短文本默认行内渲染；含 fenced code block（或 preferBlock 的多行文本）时改用块级 markdown
 * 以保留代码块 / 段落结构。 */
function pracRichText(text, inlineClassName, blockClassName, preferBlock) {
	const source = text === undefined || text === null ? '' : String(text);
	if (pracHasCodeFence(source) || (preferBlock && source.indexOf('\n') >= 0)) {
		return h('div', { className: 'dsp-md dsp-md-preserve ' + blockClassName }, DSP.markdown(source));
	}
	return h('span', { className: inlineClassName }, pracInlineMarkdown(source));
}

function PracticeQuestionCard(props) {
	const question = props.question || {};
	const type = question.type || 'other';
	const tags = Array.isArray(question.tags) ? question.tags.filter(Boolean) : [];
	const figures = Array.isArray(question.figures) ? question.figures : [];
	const group = pracFindGroup(props.setData, question.groupId);
	const record = props.record || null;
	const revealed = Boolean(props.revealed);
	const pinnedFigureKey = props.pinnedFigureKey || null;

	let statusTag = null;
	if (record && revealed) {
		if (record.correct === true) statusTag = h(DSP.Tag, { tone: 'success' }, DSP.t('正确'));
		else if (record.correct === false) statusTag = h(DSP.Tag, { tone: 'error' }, DSP.t('错误'));
		else statusTag = h(DSP.Tag, { tone: 'warn' }, '待自评');
	}

	return h(
		'div',
		{ className: 'dsp-card dsp-question' },
		h(
			'div',
			{ className: 'dsp-question-head' },
			h(
				'div',
				{ className: 'dsp-question-head-main' },
				h('span', { className: 'dsp-question-number' }, '第 ' + pracQuestionNumber(question, props.index) + ' 题'),
				h(DSP.Tag, { tone: 'neutral' }, pracTypeLabel(type)),
				question.difficulty ? h(DSP.Tag, { tone: pracDifficultyTone(question.difficulty) }, pracDifficultyLabel(question.difficulty)) : null,
				tags.slice(0, 4).map(function (tag, tagIndex) {
					return h(DSP.Tag, { key: 'tag-' + tagIndex, tone: 'neutral' }, String(tag));
				})
			),
			statusTag ? h('div', { className: 'dsp-question-head-status' }, statusTag) : null
		),
		group
			? h(PracticeMaterial, {
					group: group,
					courseId: props.courseId,
					setId: props.setId,
					onPinFigure: props.onPinFigure,
					pinnedFigureKey: pinnedFigureKey
			  })
			: null,
		h('div', { className: 'dsp-question-stem dsp-md dsp-md-preserve' }, DSP.markdown(question.stem || '')),
		figures.length > 0
			? h(
					'div',
					{ className: 'dsp-question-figures' },
					figures.map(function (figure, figureIndex) {
						const item = figure || {};
						return h(PracticeFigure, {
							key: String(item.relPath || item.kind || 'figure') + '-' + figureIndex,
							figure: item,
							index: figureIndex,
							courseId: props.courseId,
							setId: props.setId,
							questionId: question.id,
							svgJob: props.svgJob,
							onRedraw: props.onRedrawFigure,
							onPinFigure: props.onPinFigure,
							pinned: Boolean(item.relPath) && pracFigurePinKey(props.courseId, item.relPath) === pinnedFigureKey
						});
					})
			  )
			: null,
		h(PracticeAnswerControl, {
			question: question,
			index: props.index,
			value: (props.local.answers || {})[question.id],
			revealed: revealed,
			locked: Boolean(props.locked),
			onChange: props.onChange
		}),
		revealed
			? h(PracticeRevealPanel, {
					question: question,
					record: record,
					courseId: props.courseId,
					setId: props.setId,
					isLast: Boolean(props.isLast),
					onAsk: props.onAsk,
					onSelfGrade: props.onSelfGrade,
					onNext: props.onNext,
					aiGrade: props.aiGrade
			  })
			: null
	);
}

function PracticeMaterial(props) {
	const group = props.group || {};
	const figures = Array.isArray(group.figures) ? group.figures : [];
	const pinnedFigureKey = props.pinnedFigureKey || null;
	/* 材料（共用材料）直接显示：标题行 + 材料正文 + 材料内题图。 */
	return h(
		'div',
		{ className: 'dsp-question-material' },
		h(
			'div',
			{ className: 'dsp-question-material-head' },
			h(DSP.Icon, { name: 'book', size: 14 }),
			h('span', { className: 'dsp-question-material-title' }, DSP.t('材料'))
		),
		h(
			'div',
			{ className: 'dsp-question-material-body' },
			group.material
				? h('div', { className: 'dsp-md dsp-md-preserve' }, DSP.markdown(group.material))
				: h('div', { className: 'dsp-small dsp-muted' }, '（材料为空）'),
			figures.length > 0
				? h(
						'div',
						{ className: 'dsp-question-figures dsp-question-material-figures' },
						figures.map(function (figure, figureIndex) {
							const item = figure || {};
							return h(PracticeFigure, {
								key: 'material-figure-' + figureIndex,
								figure: item,
								index: figureIndex,
								courseId: props.courseId,
								setId: props.setId,
								questionId: null,
								svgJob: null,
								onRedraw: null,
								onPinFigure: props.onPinFigure,
								pinned: Boolean(item.relPath) && pracFigurePinKey(props.courseId, item.relPath) === pinnedFigureKey
							});
						})
				  )
				: null
		)
	);
}

function PracticeFigure(props) {
	const figure = props.figure || {};
	const errorState = React.useState(false);
	const failed = errorState[0];
	const setFailed = errorState[1];
	const svgJob = props.svgJob || null;
	const busy = Boolean(
		svgJob &&
			svgJob.status === 'running' &&
			svgJob.setId === props.setId &&
			svgJob.questionId === props.questionId &&
			Number(svgJob.figureIndex) === Number(props.index)
	);
	const canRedraw = typeof props.onRedraw === 'function' && Boolean(props.questionId);
	const canPin = Boolean(figure.relPath) && typeof props.onPinFigure === 'function';
	/* 该图已固定到左侧面板时，题目内 inline 图原地隐藏（display:none，DOM/组件保持挂载）。 */
	const pinned = Boolean(props.pinned);
	const src = figure.relPath ? DSP.assetUrl(props.courseId, figure.relPath) : '';
	const alt = figure.alt ? String(figure.alt) : DSP.t('图片') + ' ' + (props.index + 1);

	function handlePin(event) {
		if (!canPin) return;
		if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
		props.onPinFigure({
			courseId: props.courseId,
			relPath: figure.relPath,
			alt: alt
		});
	}

	/* 点击图片固定到左侧面板；固定后该 inline 图用 display:none 隐藏（不卸载），
	 * 关闭面板或固定另一张图时恢复显示；关闭按钮/换图在 PracticeArea 层处理。 */
	const pinProps = canPin
		? {
				onClick: handlePin,
				onKeyDown: function (event) {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						handlePin(event);
					}
				},
				role: 'button',
				tabIndex: 0,
				title: '固定到左侧查看（关闭左侧图片面板后恢复显示）'
		  }
		: {};

	return h(
		'figure',
		{
			className: 'dsp-figure',
			style: pinned ? { display: 'none' } : undefined,
			'aria-hidden': pinned ? 'true' : undefined
		},
		src && !failed
			? h(
					'img',
					Object.assign(
						{
							className: DSP.cls('dsp-figure-img', canPin ? 'dsp-figure-img-pinnable' : ''),
							src: src,
							alt: alt,
							loading: 'lazy',
							onError: function () {
								setFailed(true);
							}
						},
						pinProps
					)
			  )
			: h(
					'div',
					Object.assign({ className: 'dsp-figure-placeholder' }, pinProps),
					h(DSP.Icon, { name: 'image', size: 22 }),
					h('span', null, failed ? '图片加载失败' : '暂无图片')
			  ),
		h(
			'figcaption',
			{ className: 'dsp-figure-cap' },
			h('span', { className: 'dsp-figure-alt dsp-truncate' }, alt),
			canRedraw
				? h(
						DSP.Btn,
						{
							variant: 'ghost',
							icon: busy ? undefined : 'refresh',
							loading: busy,
							disabled: busy,
							className: 'dsp-figure-redraw',
							title: DSP.t('重新绘制示图'),
							onClick: function () {
								props.onRedraw(props.questionId, props.index);
							}
						},
						busy ? DSP.t('正在生成') : DSP.t('重新绘制示图')
				  )
				: null
		)
	);
}

function PracticeChoiceList(props) {
	const question = props.question || {};
	const options = Array.isArray(props.options) ? props.options : [];
	const selectedKeys = (props.selectedKeys || []).map(String);
	const correctKeys = (props.correctKeys || []).map(String);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	return h(
		'div',
		{ className: 'dsp-answer-list' + (props.multiple ? ' dsp-answer-multiple' : ''), role: props.multiple ? 'group' : 'radiogroup' },
		options.map(function (option, optionIndex) {
			const item = option || {};
			const key = String(item.key === undefined || item.key === null ? optionIndex : item.key);
			const selected = selectedKeys.indexOf(key) >= 0;
			const isCorrect = revealed && correctKeys.indexOf(key) >= 0;
			const isWrong = revealed && selected && !isCorrect;
			const text = item.text === undefined || item.text === null ? '' : String(item.text);
			return h(
				'label',
				{
					key: key + '-' + optionIndex,
					className: DSP.cls(
						'dsp-answer-option',
						selected ? 'dsp-answer-option-selected' : '',
						isCorrect ? 'dsp-answer-option-correct' : '',
						isWrong ? 'dsp-answer-option-wrong' : '',
						disabled ? 'dsp-answer-option-locked' : ''
					)
				},
				h('input', {
					type: props.multiple ? 'checkbox' : 'radio',
					name: props.name || 'practice-choice',
					checked: selected,
					disabled: disabled,
					onChange: function () {
						if (disabled) return;
						if (props.multiple) {
							const next = selectedKeys.slice();
							const position = next.indexOf(key);
							if (position >= 0) next.splice(position, 1);
							else next.push(key);
							props.onChange(next);
						} else {
							props.onChange([key]);
						}
					}
				}),
				h('span', { className: 'dsp-answer-indicator', 'aria-hidden': 'true' }, h('span', { className: 'dsp-answer-dot' })),
				h('span', { className: 'dsp-answer-key' }, key),
				pracRichText(text, 'dsp-answer-text', 'dsp-answer-text dsp-answer-text-block'),
				isCorrect ? h(DSP.Icon, { key: 'correct', name: 'checkCircle', size: 15, className: 'dsp-answer-mark dsp-answer-mark-correct' }) : null,
				isWrong ? h(DSP.Icon, { key: 'wrong', name: 'closeCircle', size: 15, className: 'dsp-answer-mark dsp-answer-mark-wrong' }) : null
			);
		})
	);
}

function PracticeFillControl(props) {
	const question = props.question || {};
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	const blanks = Math.max(1, pracToArray(question.answer).length);
	const inputs = [];
	for (let index = 0; index < blanks; index += 1) {
		inputs.push(
			h(
				'div',
				{ className: 'dsp-fill-row', key: 'blank-' + index },
				blanks > 1 ? h('span', { className: 'dsp-fill-label dsp-small dsp-muted' }, '第 ' + (index + 1) + ' 空') : null,
				h('input', {
					className: 'dsp-input dsp-fill-input',
					type: 'text',
					value: value[index] === undefined ? '' : value[index],
					placeholder: blanks > 1 ? '填写第 ' + (index + 1) + ' 空' : '填写答案',
					disabled: disabled,
					onChange: function (event) {
						if (disabled) return;
						const next = value.slice();
						while (next.length < blanks) next.push('');
						next[index] = event.target.value;
						props.onChange(next);
					}
				})
			)
		);
	}
	return h(
		'div',
		{ className: 'dsp-fill' },
		h('div', { className: 'dsp-fill-hint dsp-small dsp-muted' }, '填写后提交，系统会自动去空白 / 标点比对；若判定不一致，可对照参考答案自评。'),
		inputs
	);
}

function PracticeTextControl(props) {
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	const disabled = revealed || locked;
	return h(
		'div',
		{ className: 'dsp-answer-textarea-wrap' },
		h('textarea', {
			className: 'dsp-textarea dsp-answer-textarea',
			value: value[0] === undefined ? '' : value[0],
			placeholder: '写下你的答案…',
			disabled: disabled,
			onChange: function (event) {
				if (disabled) return;
				props.onChange([event.target.value]);
			}
		}),
		h('div', { className: 'dsp-small dsp-muted dsp-answer-textarea-hint' }, '简答题提交后显示参考答案，需要你对照自评。')
	);
}

function PracticeAnswerControl(props) {
	const question = props.question || {};
	const type = question.type || 'other';
	const value = pracToArray(props.value);
	const revealed = Boolean(props.revealed);
	const locked = Boolean(props.locked);
	if (type === 'single' || type === 'multiple') {
		const options = Array.isArray(question.options) ? question.options : [];
		if (options.length === 0) {
			return h('div', { className: 'dsp-practice-banner dsp-practice-banner-info' }, h(DSP.Icon, { name: 'alert', size: 14 }), h('span', { className: 'dsp-practice-banner-text' }, '这道题没有可选项，请结合材料作答。'));
		}
		return h(PracticeChoiceList, {
			question: question,
			options: options,
			multiple: type === 'multiple',
			selectedKeys: value,
			correctKeys: pracToArray(question.answer).map(String),
			revealed: revealed,
			locked: locked,
			name: 'practice-' + String(question.id || 'q') + '-' + props.index,
			onChange: props.onChange
		});
	}
	if (type === 'judge') {
		return h(PracticeChoiceList, {
			question: question,
			options: [
				{ key: '正确', text: DSP.t('正确') },
				{ key: '错误', text: DSP.t('错误') }
			],
			multiple: false,
			selectedKeys: value,
			correctKeys: pracJudgeCorrectKeys(question),
			revealed: revealed,
			locked: locked,
			name: 'practice-' + String(question.id || 'q') + '-' + props.index,
			onChange: props.onChange
		});
	}
	if (type === 'fill') {
		return h(PracticeFillControl, { question: question, value: value, revealed: revealed, locked: locked, onChange: props.onChange });
	}
	return h(PracticeTextControl, { question: question, value: value, revealed: revealed, locked: locked, onChange: props.onChange });
}

/* ------------------------------------------------------------------ */
/* 参考答案来源 / 无答案兜底（两阶段参考答案 Host 改造配套）            */
/*   answerSource: 'source' 原卷答案 | 'ai-doc' AI 参考+课程文档依据   */
/*                 | 'ai' AI 生成；旧 set.json 无字段时按原卷处理。     */
/* ------------------------------------------------------------------ */

function pracRevealAnswerSource(question) {
	const source = question ? question.answerSource : null;
	if (source === 'ai-doc' || source === 'ai') return source;
	return 'source';
}

function pracRevealAnswerRefs(question) {
	const refs = question && Array.isArray(question.answerRefs) ? question.answerRefs : [];
	return refs
		.map(function (ref) {
			return ref === undefined || ref === null ? '' : String(ref).trim();
		})
		.filter(function (ref) {
			return ref !== '';
		});
}

function pracRevealHasAnswerText(question) {
	if (!question) return false;
	if (question.answerDisplay !== undefined && question.answerDisplay !== null && String(question.answerDisplay).trim() !== '') return true;
	return pracToArray(question.answer).some(function (item) {
		return String(item).trim() !== '';
	});
}

function pracRevealHasAnalysis(question) {
	return Boolean(question && question.analysis !== undefined && question.analysis !== null && String(question.analysis).trim() !== '');
}

/* ------------------------------------------------------------------ */
/* AI 判题卡片                                                         */
/*   Host /grade job.result 约定：{verdict,score,summary,suggestions,   */
/*   correctedAnswer?,refs,generatedAt}；verdict: correct|partial|      */
/*   incorrect（兼容中文/旧值）；旧记录无 aiGrade 时不渲染。            */
/* ------------------------------------------------------------------ */

function pracAiGradeVerdictInfo(grade) {
	const raw = grade && grade.verdict !== undefined && grade.verdict !== null ? String(grade.verdict).trim().toLowerCase() : '';
	if (raw === 'correct' || raw === '答对' || raw === '正确') return { label: '答对', tone: 'success' };
	if (raw === 'partial' || raw === '部分正确' || raw === '部分对') return { label: '部分正确', tone: 'warn' };
	if (raw === 'incorrect' || raw === 'wrong' || raw === '答错' || raw === '错误') return { label: '答错', tone: 'error' };
	const score = Number(grade && grade.score);
	if (Number.isFinite(score)) {
		const ratio = score > 1 ? score / 100 : score;
		if (ratio >= 0.999) return { label: '答对', tone: 'success' };
		if (ratio > 0) return { label: '部分正确', tone: 'warn' };
		return { label: '答错', tone: 'error' };
	}
	return { label: 'AI 判定', tone: 'neutral' };
}

/* Host 约定 score 为 0-100；兼容 0~1 的比例值，统一展示为「N 分」。 */
function pracAiGradeScoreText(grade) {
	const score = grade && grade.score;
	if (score === undefined || score === null || score === '') return '';
	const number = Number(score);
	if (!Number.isFinite(number)) return String(score);
	const percent = number > 0 && number < 1 && number !== Math.floor(number) ? Math.round(number * 100) : Math.round(number);
	return percent + ' 分';
}

function pracAiGradeList(value) {
	if (Array.isArray(value)) {
		return value
			.map(function (item) {
				return item === undefined || item === null ? '' : String(item).trim();
			})
			.filter(function (item) {
				return item !== '';
			});
	}
	if (typeof value === 'string' && value.trim() !== '') return [value.trim()];
	return [];
}

/* AI 判题文本字段归一：字符串 trim，数组按行合并。 */
function pracAiGradeText(value) {
	if (value === undefined || value === null) return '';
	if (Array.isArray(value)) {
		return value
			.map(function (item) {
				return item === undefined || item === null ? '' : String(item).trim();
			})
			.filter(function (item) {
				return item !== '';
			})
			.join('\n');
	}
	return String(value).trim();
}

/** 标准答案里的图片：答案文件/AI 答案解析出的答案图。 */
function PracticeAnswerFigures(props) {
	const figures = (props.figures || []).filter(function (figure) { return figure && figure.relPath; });
	if (figures.length === 0) return null;
	const courseId = props.courseId;
	return h(
		'div',
		{ className: 'dsp-answer-figures' },
		figures.map(function (figure, index) {
			return h('img', {
				key: String(figure.relPath) + '-' + index,
				className: 'dsp-answer-figure',
				src: DSP.assetUrl(courseId, figure.relPath),
				alt: figure.alt || ('答案图 ' + (index + 1)),
				loading: 'lazy'
			});
		})
	);
}

function PracticeAiGradeCard(props) {
	const grade = props.grade || {};
	const question = props.question || {};
	const verdict = pracAiGradeVerdictInfo(grade);
	const scoreText = pracAiGradeScoreText(grade);
	const suggestions = pracAiGradeList(grade.suggestions);
	const refs = pracAiGradeList(grade.refs);

	/* 新字段：standardAnswer / mistakeAnalysis / explanation（顺序固定：标准答案→我错在哪→答案解析）；
	 * 兼容旧字段 correctedAnswer / summary，且避免 summary 重复出现在多个区块。 */
	const rawStandard = pracAiGradeText(grade.standardAnswer) || pracAiGradeText(grade.correctedAnswer);
	const rawMistake = pracAiGradeText(grade.mistakeAnalysis);
	const rawExplanation = pracAiGradeText(grade.explanation);
	const rawSummary = pracAiGradeText(grade.summary);
	let standardAnswer = rawStandard;
	let mistakeAnalysis = rawMistake;
	let explanation = rawExplanation;
	if (!standardAnswer && rawSummary) standardAnswer = rawSummary;
	else if (!explanation && rawSummary) explanation = rawSummary;
	if (!mistakeAnalysis && rawSummary && rawSummary !== standardAnswer && rawSummary !== explanation) mistakeAnalysis = rawSummary;

	const section = function (key, icon, title, body, boxClassName) {
		if (!body) return null;
		return h(
			'div',
			{ key: key, className: 'dsp-ai-grade-block' },
			h('div', { className: 'dsp-ai-grade-block-title' }, h(DSP.Icon, { name: icon, size: 13 }), h('span', null, title)),
			h('div', { className: 'dsp-md dsp-md-preserve ' + boxClassName }, DSP.markdown(body))
		);
	};

	return h(
		'div',
		{ className: 'dsp-ai-grade' },
		/* 先给标准答案（图片紧随其后），再给判定与错因。 */
		section('standard', 'check', '标准答案', standardAnswer, 'dsp-ai-grade-corrected'),
		h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId }),
		h(
			'div',
			{ className: 'dsp-ai-grade-head' },
			h(DSP.Icon, { name: 'robot', size: 15 }),
			h('span', { className: 'dsp-ai-grade-title' }, 'AI 判题'),
			h(DSP.Tag, { tone: verdict.tone }, scoreText ? verdict.label + ' · ' + scoreText : verdict.label),
			grade.generatedAt ? h('span', { className: 'dsp-ai-grade-time dsp-small dsp-muted' }, DSP.fmtDate(grade.generatedAt)) : null
		),
		section('mistake', 'alert', '我错在哪', mistakeAnalysis, 'dsp-ai-grade-summary'),
		section('explanation', 'bulb', '答案解析', explanation, 'dsp-ai-grade-summary'),
		suggestions.length > 0
			? h(
					'div',
					{ key: 'suggestions', className: 'dsp-ai-grade-block' },
					h('div', { className: 'dsp-ai-grade-block-title' }, h(DSP.Icon, { name: 'sparkles', size: 13 }), h('span', null, '改进建议')),
					h(
						'ul',
						{ className: 'dsp-md dsp-md-preserve dsp-md-list dsp-ai-grade-list' },
						suggestions.map(function (text, index) {
							return h('li', { key: 'tip-' + index }, pracInlineMarkdown(text));
						})
					)
			  )
			: null,
		refs.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-refs dsp-ai-grade-refs' },
					h('span', { className: 'dsp-reveal-refs-label' }, '参考文档：'),
					refs.map(function (ref, index) {
						return h('span', { key: 'ai-ref-' + index, className: 'dsp-reveal-refs-item' }, ref);
					})
			  )
			: null
	);
}

function PracticeRevealPanel(props) {
	const question = props.question || {};
	const record = props.record || {};
	const pending = record.correct !== true && record.correct !== false;
	const source = pracRevealAnswerSource(question);
	const aiSource = source === 'ai-doc' || source === 'ai';
	const refs = aiSource ? pracRevealAnswerRefs(question) : [];
	const hasAnswerText = pracRevealHasAnswerText(question);
	const hasAnalysis = pracRevealHasAnalysis(question);
	const answerText = hasAnswerText ? pracFormatAnswer(question) : '暂无参考答案';
	const answerLabel = aiSource ? DSP.t('参考答案') : DSP.t('正确答案');
	const answerDetails = pracCorrectChoiceTexts(question);
	const isChoice = question.type === 'single' || question.type === 'multiple';
	const statusTone = pending ? 'warn' : record.correct ? 'success' : 'error';
	const statusText = pending ? '待自评' : record.correct ? DSP.t('正确') : DSP.t('错误');
	const gradeText = hasAnswerText ? '你的答案与参考答案不一致，请对照上方答案后自评：' : '本题暂无参考答案，请结合上方提示与课程文档判断你的答案是否正确：';
	const userAnswerText = pracFormatUserAnswer(question, record.answer);
	const sourceAnswerDisplay = question.sourceAnswerDisplay === undefined || question.sourceAnswerDisplay === null ? '' : String(question.sourceAnswerDisplay).trim();
	/* AI 判题结果：优先用 PracticeBody 传入的当前记录，其次兼容 record.aiGrade。 */
	const aiGrade = props.aiGrade || (record && record.aiGrade) || null;

	let sourceTag = null;
	if (source === 'ai-doc') {
		sourceTag = h(DSP.Tag, { tone: 'neutral', className: 'dsp-reveal-source dsp-reveal-source-ai-doc' }, 'AI 参考 · 依据课程文档');
	} else if (source === 'ai') {
		sourceTag = h(DSP.Tag, { tone: 'warn', className: 'dsp-reveal-source dsp-reveal-source-ai' }, 'AI 生成参考答案');
	}

	const refsLine =
		aiSource && refs.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-refs' },
					h('span', { className: 'dsp-reveal-refs-label' }, '参考文档：'),
					refs.map(function (ref, refIndex) {
						return h('span', { key: 'ref-' + refIndex, className: 'dsp-reveal-refs-item' }, ref);
					})
			  )
			: null;
	const noRefsNote =
		aiSource && refs.length === 0
			? h('div', { className: 'dsp-reveal-source-note dsp-small dsp-muted' }, '未在课程文档中找到直接依据，答案由 AI 生成，建议核对')
			: null;
	/* 「全部 AI 重新生成」模式下 Host 会把原卷答案存进 sourceAnswerDisplay，供核对 */
	const sourceAnswerLine =
		aiSource && sourceAnswerDisplay !== ''
			? h(
					'div',
					{ className: 'dsp-reveal-source-answer' },
					h('span', { className: 'dsp-reveal-source-answer-label' }, '原卷答案（供核对）：'),
					pracRichText(sourceAnswerDisplay, 'dsp-reveal-source-answer-text', 'dsp-reveal-source-answer-text-block')
			  )
			: null;

	return h(
		'div',
		{ className: 'dsp-reveal' },
		h(
			'div',
			{ className: 'dsp-reveal-head' },
			h(DSP.Tag, { tone: statusTone }, statusText),
			h(
				'div',
				{ className: 'dsp-reveal-answer-row' },
				sourceTag,
				h('span', { className: 'dsp-reveal-label' }, answerLabel),
				hasAnswerText
					? pracRichText(answerText, 'dsp-reveal-answer', 'dsp-reveal-answer-block', question.type === 'short' || question.type === 'other')
					: h('span', { className: 'dsp-reveal-answer dsp-reveal-answer-empty' }, '暂无参考答案'),
				h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId })
			),
			h(
				'div',
				{ className: 'dsp-reveal-user dsp-small dsp-muted' },
				h('span', { className: 'dsp-reveal-user-label' }, '你的答案：'),
				pracRichText(userAnswerText, 'dsp-reveal-user-text', 'dsp-reveal-user-text-block')
			)
		),
		sourceAnswerLine,
		refsLine,
		noRefsNote,
		isChoice && answerDetails.length > 0
			? h(
					'div',
					{ className: 'dsp-reveal-options' },
					answerDetails.map(function (line, lineIndex) {
						return h(
							'div',
							{ key: 'correct-' + lineIndex, className: 'dsp-reveal-option-line' },
							pracRichText(line, 'dsp-reveal-option-line-text', 'dsp-reveal-option-line-text-block')
						);
					})
			  )
			: null,
		h(
			'div',
			{ className: 'dsp-reveal-analysis' },
			h('div', { className: 'dsp-reveal-analysis-title' }, h(DSP.Icon, { name: 'bulb', size: 14 }), h('span', null, DSP.t('解析'))),
			hasAnalysis
				? h('div', { className: 'dsp-md dsp-md-preserve dsp-reveal-analysis-body' }, DSP.markdown(question.analysis))
				: !hasAnswerText
				? h('div', { className: 'dsp-reveal-empty-hint dsp-small' }, '本题原卷未提供答案，可点「一键提问」让 AI 结合课程文档解答。')
				: h('div', { className: 'dsp-small dsp-muted' }, DSP.t('暂无解析'))
		),
		pending
			? h(
					'div',
					{ className: 'dsp-reveal-grade' },
					h('div', { className: 'dsp-reveal-grade-text' }, gradeText),
					h(
						'div',
						{ className: 'dsp-row dsp-gap-8 dsp-reveal-grade-actions' },
						h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'check',
								className: 'dsp-grade-btn dsp-grade-btn-correct',
								onClick: function () {
									props.onSelfGrade(true);
								}
							},
							'我答对了'
						),
						h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'x',
								className: 'dsp-grade-btn dsp-grade-btn-wrong',
								onClick: function () {
									props.onSelfGrade(false);
								}
							},
							'我答错了'
						)
					)
			  )
			: null,
		aiGrade ? h(PracticeAiGradeCard, { grade: aiGrade, question: question, courseId: props.courseId }) : null,
		h(
			'div',
			{ className: 'dsp-reveal-actions' },
			h(DSP.Btn, { variant: 'secondary', icon: 'sparkles', onClick: props.onAsk }, DSP.t('一键提问')),
			props.isLast ? null : h(DSP.Btn, { variant: 'primary', icon: 'chevronRight', onClick: props.onNext }, DSP.t('下一题'))
		)
	);
}

/* ==== src/client/42-practice-result.js ==== */
/* 刷题模式 Client — 刷题区交卷结果页（practice-ui-dev 维护，40-practice.js 的相邻碎片）。
 *
 * 组件结构：
 *   PracticeResultPage     交卷/已完成后的结果页：本套统计（题数 / 已答 / 正确率 / 正确题数 / 总用时）、
 *                          各题型正确率、待自评题目（全部做完再看模式下交卷后仍可自评）、
 *                          学情分析与复习建议、返回课程 / 再练一次 / 查看课程看板。
 *   PracticeTypeAccuracy   纯 CSS 的题型正确率条形图。
 *   PracticePendingGrade   待自评列表（提交答案、自评正确/错误，保存后刷新统计）。
 *   PracticeAnalysisPanel  课程级 AI 学情分析：actions.diagnose('course') + course.analyses.course.markdown，
 *                          生成中展示 state.ui.analysisJob 进度。
 */

function PracticeResultPage(props) {
	const questions = (props.setData && props.setData.questions) || [];
	const local = props.local || {};
	const stats = pracSetStats(questions, local);
	const durationMs = pracTotalDuration(questions, local) || (local.startedAt ? Math.max(0, Date.now() - local.startedAt) : 0);
	const completedAt = props.setSummary && props.setSummary.completedAt;
	const title = (props.setData && (props.setData.title || (props.setSummary && props.setSummary.title))) || DSP.t('题目集');
	const courseName = (props.course && props.course.name) || '';

	const pendingQuestions = questions.filter(function (question) {
		const record = question && local.records ? local.records[question.id] : null;
		return Boolean(record && record.revealed && record.correct !== true && record.correct !== false);
	});

	function handleSelfGrade(question, correct) {
		const record = question ? local.records[question.id] : null;
		if (!record) return;
		const next = Object.assign({}, record, { correct: Boolean(correct), selfGraded: true, revealed: true });
		local.records[question.id] = next;
		local.revealed[question.id] = true;
		if (typeof props.refresh === 'function') props.refresh();
		Promise.resolve(DSP.store.actions.saveRecords(props.courseId, props.setId, [next])).catch(pracToastError);
	}

	const statItems = [
		{ label: DSP.t('题目'), value: String(stats.total) + ' 道' },
		{ label: DSP.t('已答'), value: stats.answered + ' / ' + stats.total },
		{ label: DSP.t('正确率'), value: stats.accuracy === null ? '—' : DSP.fmtPct(stats.accuracy) },
		{ label: DSP.t('正确') + ' / ' + DSP.t('已答'), value: stats.correct + ' / ' + stats.judged },
		{ label: DSP.t('用时'), value: DSP.fmtDuration(durationMs) }
	];

	return h(
		'div',
		{ className: 'dsp-practice-panel' },
		h(
			'div',
			{ className: 'dsp-practice-scroll' },
			h(
				'div',
				{ className: 'dsp-practice-inner dsp-result' },
				h(
					'div',
					{ className: 'dsp-card dsp-result-hero' },
					h('div', { className: 'dsp-result-icon' }, h(DSP.Icon, { name: 'checkCircle', size: 28 })),
					h(
						'div',
						{ className: 'dsp-result-hero-text' },
						h('h1', { className: 'dsp-page-title' }, '本套练习完成'),
						h(
							'div',
							{ className: 'dsp-page-sub' },
							(title ? title + ' · ' : '') + courseName + (completedAt ? ' · ' + DSP.fmtDate(completedAt) : '')
						)
					),
					h('div', { className: 'dsp-result-hero-side' }, h(DSP.Tag, { tone: 'brand' }, pracModeLabel(props.mode)))
				),
				h(
					'div',
					{ className: 'dsp-result-stats' },
					statItems.map(function (item) {
						return h(
							'div',
							{ key: item.label, className: 'dsp-card dsp-result-stat' },
							h('div', { className: 'dsp-result-stat-value' }, item.value),
							h('div', { className: 'dsp-result-stat-label dsp-small dsp-muted' }, item.label)
						);
					})
				),
				h(PracticeTypeAccuracy, { buckets: stats.byType }),
				pendingQuestions.length > 0
					? h(PracticePendingGrade, {
							questions: pendingQuestions,
							records: local.records,
							courseId: props.courseId,
							onSelfGrade: handleSelfGrade
					  })
					: null,
				h(
					'div',
					{ className: 'dsp-result-actions' },
					h(DSP.Btn, { variant: 'primary', icon: 'refresh', onClick: props.onRestart }, DSP.t('重新练习')),
					h(DSP.Btn, { variant: 'secondary', icon: 'arrowLeft', onClick: props.onBack }, DSP.t('返回课程')),
					h(
						DSP.Btn,
						{
							variant: 'ghost',
							icon: 'chart',
							onClick: function () {
								DSP.store.actions.openCourseDash(props.courseId);
							}
						},
						DSP.t('查看课程看板')
					)
				),
				h(PracticeAnalysisPanel, { courseId: props.courseId })
			)
		)
	);
}

function PracticeTypeAccuracy(props) {
	const buckets = props.buckets || [];
	return h(
		'div',
		{ className: 'dsp-card dsp-type-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h('h3', { className: 'dsp-section-title' }, DSP.t('题型分布')),
			h('span', { className: 'dsp-small dsp-muted' }, '正确率按已判定题目统计')
		),
		buckets.length === 0
			? h('div', { className: 'dsp-small dsp-muted' }, DSP.t('还没有数据'))
			: buckets.map(function (bucket) {
					const accuracy = bucket.judged > 0 ? bucket.correct / bucket.judged : null;
					const width = accuracy === null ? 0 : Math.round(accuracy * 100);
					return h(
						'div',
						{ key: bucket.type, className: 'dsp-type-row' },
						h('span', { className: 'dsp-type-label' }, pracTypeLabel(bucket.type)),
						h('span', { className: 'dsp-type-count dsp-small dsp-muted' }, bucket.answered + ' / ' + bucket.total),
						h(
							'div',
							{ className: 'dsp-type-track' },
							h('div', {
								className: 'dsp-type-fill' + (accuracy !== null && accuracy < 0.6 ? ' dsp-type-fill-low' : ''),
								style: { width: width + '%' }
							})
						),
						h('span', { className: 'dsp-type-pct' }, accuracy === null ? '—' : DSP.fmtPct(accuracy))
					);
			  })
	);
}

function PracticePendingGrade(props) {
	const questions = props.questions || [];
	const records = props.records || {};
	return h(
		'div',
		{ className: 'dsp-card dsp-pending-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h('h3', { className: 'dsp-section-title' }, '待自评题目 (' + questions.length + ')'),
			h('span', { className: 'dsp-small dsp-muted' }, '对照参考答案，选择你的答案是否算正确')
		),
		questions.map(function (question, index) {
			const record = records[question.id] || {};
			/* 与解析区一致：AI 参考答案来源 tag；旧数据/原卷答案不显示 tag。 */
			const answerSource = pracRevealAnswerSource(question);
			const hasAnswerText = pracRevealHasAnswerText(question);
			const answerText = hasAnswerText ? pracFormatAnswer(question) : '暂无参考答案';
			let sourceTag = null;
			if (answerSource === 'ai-doc') {
				sourceTag = h(DSP.Tag, { tone: 'neutral', className: 'dsp-reveal-source dsp-reveal-source-ai-doc' }, 'AI 参考 · 依据课程文档');
			} else if (answerSource === 'ai') {
				sourceTag = h(DSP.Tag, { tone: 'warn', className: 'dsp-reveal-source dsp-reveal-source-ai' }, 'AI 生成参考答案');
			}
			return h(
				'div',
				{ key: question.id || 'pending-' + index, className: 'dsp-card-flat dsp-pending-item' },
				h(
					'div',
					{ className: 'dsp-pending-head' },
					h('span', { className: 'dsp-pending-number' }, '第 ' + pracQuestionNumber(question, index) + ' 题'),
					sourceTag,
					h(DSP.Tag, { tone: 'neutral' }, pracTypeLabel(question.type)),
					h('span', { className: 'dsp-pending-stem dsp-truncate' }, pracQuestionStemText(question))
				),
				h(
					'div',
					{ className: 'dsp-pending-answers dsp-small' },
					h('span', { className: 'dsp-pending-answer' }, '你的答案：' + pracFormatUserAnswer(question, record.answer)),
					h('span', { className: 'dsp-pending-answer' }, '参考答案：' + answerText)
				),
				h(PracticeAnswerFigures, { figures: question.answerFigures, courseId: props.courseId }),
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-pending-actions' },
					h(
						DSP.Btn,
						{
							variant: 'secondary',
							icon: 'check',
							className: 'dsp-grade-btn dsp-grade-btn-correct',
							onClick: function () {
								props.onSelfGrade(question, true);
							}
						},
						'我答对了'
					),
					h(
						DSP.Btn,
						{
							variant: 'secondary',
							icon: 'x',
							className: 'dsp-grade-btn dsp-grade-btn-wrong',
							onClick: function () {
								props.onSelfGrade(question, false);
							}
						},
						'我答错了'
					)
				)
			);
		})
	);
}

function PracticeAnalysisPanel(props) {
	const storeState = DSP.useStore(function (value) {
		const courseValue =
			(value.data.courses || []).find(function (course) {
				return course.id === props.courseId;
			}) || null;
		const analyses = courseValue && courseValue.analyses ? courseValue.analyses : null;
		return { job: value.ui.analysisJob || null, analysis: analyses ? analyses.course || null : null };
	});
	const job = storeState.job;
	const analysis = storeState.analysis;
	const state = React.useState(false);
	const starting = state[0];
	const setStarting = state[1];
	const running = Boolean(job && job.scope === 'course' && job.status === 'running');
	const fraction = pracProgressFraction(job && job.progress);

	function generate() {
		if (starting || running) return;
		setStarting(true);
		(async function () {
			try {
				await DSP.store.actions.diagnose('course');
				DSP.store.actions.toast('复习建议已生成', 'success');
			} catch (error) {
				pracToastError(error);
			}
			setStarting(false);
		})();
	}

	return h(
		'div',
		{ className: 'dsp-card dsp-result-analysis' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-4' },
				h('h3', { className: 'dsp-section-title' }, DSP.t('学情分析') + ' · ' + DSP.t('复习方案')),
				h(
					'span',
					{ className: 'dsp-small dsp-muted' },
					analysis ? '更新于 ' + DSP.fmtDate(analysis.generatedAt) + (analysis.stale ? '（数据已更新，可刷新）' : '') : '结合本套成绩与课程文档生成学习建议'
				)
			),
			h(
				DSP.Btn,
				{
					variant: 'secondary',
					icon: 'sparkles',
					loading: running || starting,
					disabled: running || starting,
					onClick: generate
				},
				analysis ? DSP.t('刷新分析') : DSP.t('生成复习方案')
			)
		),
		running
			? h(
					'div',
					{ className: 'dsp-analysis-progress' },
					h(DSP.ProgressBar, { value: fraction }),
					h('div', { className: 'dsp-small dsp-muted' }, (job && job.message) || DSP.t('正在生成') + '…')
			  )
			: null,
		analysis && analysis.markdown
			? h('div', { className: 'dsp-md dsp-analysis-body' }, DSP.markdown(analysis.markdown))
			: running
			? null
			: h('div', { className: 'dsp-small dsp-muted' }, '还没有生成复习建议。点击右上角按钮，让 AI 结合本套练习记录与课程文档给出学情分析和复习重点。')
	);
}

/* ==== src/client/50-chat.js ==== */
/* 刷题模式 Client — 右侧对话面板（chat-ui-dev）。
 * 负责：对话头部 / 上下文 chips / 消息列表（markdown + 流式）/ 空态 / 输入区。
 * 只读 DSP.store，所有写操作走 DSP.store.actions；组件全部用 React.createElement 书写。
 * 依赖：10-utils 的 DSP.* 基础能力、20-store 的聊天状态；75-composer-attach 提供 chips 渲染。
 */

var chatNewThreadKey = '__new__';
var chatSuggestionDefs = [
	{ icon: 'target', text: '帮我梳理这道题的考点' },
	{ icon: 'alert', text: '我的答案错在哪' },
	{ icon: 'chart', text: '这类题怎么避免再错' }
];
var chatMaxSelectionPreview = 160;

/* 对话区宽度 / 收起状态的本地持久化（localStorage 不可用时静默降级）。 */
var chatWidthStorageKey = 'practice-mode.chat.width';
var chatCollapsedStorageKey = 'practice-mode.chat.collapsed';
var chatDefaultWidth = 384;
var chatMinWidth = 280;
var chatMaxWidth = 640;
var chatCollapsedWidth = 44;

function chatStorageGet(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return null;
		return window.localStorage.getItem(key);
	} catch (error) {
		return null;
	}
}

function chatStorageSet(key, value) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.setItem(key, String(value));
	} catch (error) {
		/* localStorage 不可用时忽略 */
	}
}

function chatStorageRemove(key) {
	try {
		if (typeof window === 'undefined' || !window.localStorage) return;
		window.localStorage.removeItem(key);
	} catch (error) {
		/* localStorage 不可用时忽略 */
	}
}

function chatReadStoredWidth() {
	var raw = chatStorageGet(chatWidthStorageKey);
	if (raw === null || raw === undefined || raw === '') return null;
	var parsed = Number(raw);
	if (!Number.isFinite(parsed) || parsed <= 0) return null;
	return Math.round(parsed);
}

/* 宽度统一夹取：280~640；视口较窄时再夹到 min(640, 窗口宽度 * 0.55)。 */
function chatClampWidth(width, viewportWidth) {
	var value = Number(width);
	if (!Number.isFinite(value)) value = chatDefaultWidth;
	var maxWidth = chatMaxWidth;
	var windowWidth = Number(viewportWidth);
	if (Number.isFinite(windowWidth) && windowWidth > 0) {
		maxWidth = Math.max(chatMinWidth, Math.min(chatMaxWidth, Math.round(windowWidth * 0.55)));
	}
	return Math.max(chatMinWidth, Math.min(maxWidth, Math.round(value)));
}

/* ------------------------------------------------------------------ */
/* 输入动作                                                            */
/* ------------------------------------------------------------------ */

function chatSendText(text) {
	var value = String(text == null ? '' : text).trim();
	if (!value) return;
	DSP.store.actions.chatSend(value);
}

function chatSendDraft() {
	var state = DSP.store.get();
	var chat = state.ui && state.ui.chat ? state.ui.chat : {};
	var draft = String(chat.draft == null ? '' : chat.draft).trim();
	if (!draft) return;
	DSP.store.actions.chatSend(draft);
}

/* ------------------------------------------------------------------ */
/* 单条消息                                                            */
/* ------------------------------------------------------------------ */

function chatMessageKey(message, index) {
	var role = message && message.role ? String(message.role) : 'message';
	var at = message && message.at ? String(message.at) : '';
	return role + '-' + at + '-' + index;
}

/* 模型偶尔把 Markdown 标题/列表挤成一行；渲染前尽量修复换行。 */
function chatFormatMarkdown(text) {
	var source = String(text == null ? '' : text);
	if (typeof DSP.repairCollapsedMarkdown === 'function') {
		try {
			return DSP.repairCollapsedMarkdown(source);
		} catch (error) {
			return source;
		}
	}
	return source;
}

function chatUserMessageView(message) {
	var context = (message && message.context) || {};
	var attachments = Array.isArray(context.attachments) ? context.attachments.filter(function (item) {
		return item && (item.type === 'question' || item.type === 'selection');
	}) : [];
	var contextTags = null;
	if (attachments.length > 0) {
		contextTags = h(
			'div',
			{ className: 'dsp-chat-msg-context' },
			attachments.map(function (item, index) {
				var isQuestion = item.type === 'question';
				var label = item.label || (isQuestion ? DSP.t('题目') : DSP.t('选中文字'));
				return h(
					'span',
					{ key: 'ctx-' + index, className: 'dsp-chat-ctx-tag' },
					h(DSP.Icon, { name: isQuestion ? 'list' : 'chat', size: 11 }),
					h('span', null, DSP.t(label))
				);
			})
		);
	}
	var selectedText = typeof context.selectedText === 'string' ? context.selectedText.replace(/\s+/g, ' ').trim() : '';
	var quote = selectedText
		? h(
			'div',
			{ className: 'dsp-chat-quote' },
			selectedText.length > chatMaxSelectionPreview ? selectedText.slice(0, chatMaxSelectionPreview) + '…' : selectedText
		)
		: null;
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-user' },
		h(
			'div',
			{ className: 'dsp-chat-bubble dsp-chat-bubble-user' },
			contextTags,
			quote,
			h('div', { className: 'dsp-chat-bubble-text' }, String(message && message.text != null ? message.text : ''))
		)
	);
}

function chatAssistantMessageView(message) {
	var isError = Boolean(message && (message.error === true || message.role === 'error'));
	var text = String(message && message.text != null ? message.text : '');
	var refs = message && Array.isArray(message.refs) ? message.refs.filter(Boolean) : [];
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-assistant' + (isError ? ' dsp-chat-msg-error' : '') },
		h(
			'div',
			{ className: 'dsp-chat-avatar' },
			h(DSP.Icon, { name: isError ? 'alert' : 'robot', size: 15 })
		),
		h(
			'div',
			{ className: 'dsp-chat-assistant-body' },
			h('div', { className: 'dsp-md dsp-chat-md' }, DSP.markdown(chatFormatMarkdown(text))),
			refs.length > 0
				? h(
					'div',
					{ className: 'dsp-chat-refs' },
					refs.map(function (ref, index) {
						var name = typeof ref === 'string' ? ref : (ref && (ref.name || ref.title)) || '';
						if (!name) return null;
						return h(
							DSP.Tag,
							{ key: 'ref-' + index, tone: 'neutral', className: 'dsp-chat-ref' },
							h(DSP.Icon, { name: 'doc', size: 11 }),
							name
						);
					})
				)
				: null
		)
	);
}

function chatMessageView(props) {
	var message = props ? props.message : null;
	if (!message || !message.role) return null;
	if (message.role === 'user') return chatUserMessageView(message);
	return chatAssistantMessageView(message);
}

var chatMessageMemo = React.memo(chatMessageView);

/* ------------------------------------------------------------------ */
/* 消息列表 / 流式气泡                                                  */
/* ------------------------------------------------------------------ */

function chatHistoryView(props) {
	var messages = props && Array.isArray(props.messages) ? props.messages : [];
	if (messages.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-chat-messages', role: 'log' },
		messages.map(function (message, index) {
			return h(chatMessageMemo, { key: chatMessageKey(message, index), message: message });
		})
	);
}

var chatHistoryMemo = React.memo(chatHistoryView);

function chatPendingView(props) {
	if (!props || !props.streaming) return null;
	var pending = String(props.pending || '');
	return h(
		'div',
		{ className: 'dsp-chat-msg dsp-chat-msg-assistant dsp-chat-msg-pending' },
		h('div', { className: 'dsp-chat-avatar' }, h(DSP.Icon, { name: 'robot', size: 15 })),
		h(
			'div',
			{ className: 'dsp-chat-assistant-body' },
			pending
				? h('div', { className: 'dsp-md dsp-chat-md dsp-chat-stream-md' }, DSP.markdown(chatFormatMarkdown(pending)))
				: h(
					'div',
					{ className: 'dsp-chat-thinking' },
					h(DSP.Spinner, { size: 14 }),
					h('span', null, DSP.t('正在思考') + '…')
				)
		)
	);
}

var chatPendingMemo = React.memo(chatPendingView);

/* ------------------------------------------------------------------ */
/* 空态                                                               */
/* ------------------------------------------------------------------ */

function chatEmptyView(props) {
	var hasCourse = Boolean(props && props.hasCourse);
	if (!hasCourse) {
		return h(
			'div',
			{ className: 'dsp-chat-empty dsp-chat-empty-center' },
			h('div', { className: 'dsp-chat-empty-icon' }, h(DSP.Icon, { name: 'chat', size: 22 })),
			h('div', { className: 'dsp-chat-empty-title' }, DSP.t('选择一个课程开始提问'))
		);
	}
	return h(
		'div',
		{ className: 'dsp-chat-empty' },
		h('div', { className: 'dsp-chat-empty-icon' }, h(DSP.Icon, { name: 'sparkles', size: 22 })),
		h('div', { className: 'dsp-chat-empty-title' }, '基于当前题目与你的回答'),
		h(
			'div',
			{ className: 'dsp-chat-suggestions' },
			chatSuggestionDefs.map(function (item) {
				return h(
					'button',
					{
						key: item.text,
						type: 'button',
						className: 'dsp-chat-suggest',
						onClick: function () {
							DSP.store.actions.setDraft(item.text);
							chatSendText(item.text);
						}
					},
					h(DSP.Icon, { name: item.icon, size: 14 }),
					h('span', null, DSP.t(item.text))
				);
			})
		)
	);
}

var chatEmptyMemo = React.memo(chatEmptyView);

/* ------------------------------------------------------------------ */
/* 头部                                                               */
/* ------------------------------------------------------------------ */

function chatHeaderView(props) {
	var p = props || {};
	var courseName = p.courseName || '';
	var busy = Boolean(p.streaming);
	return h(
		'header',
		{ className: 'dsp-chat-head' },
		h(
			'div',
			{ className: 'dsp-chat-head-main' },
			h(
				'div',
				{ className: 'dsp-chat-title-row' },
				h(DSP.Icon, { name: 'chat', size: 15, className: 'dsp-chat-title-icon' }),
				h('div', { className: 'dsp-chat-title' }, DSP.t('答疑助手'))
			),
			h('div', { className: 'dsp-chat-sub', title: courseName }, courseName || DSP.t('未选择课程'))
		),
		h(
			'div',
			{ className: 'dsp-chat-head-actions' },
			h(DSP.IconBtn, {
				icon: 'chevronRight',
				size: 15,
				label: DSP.t('收起对话'),
				onClick: typeof p.onCollapse === 'function' ? p.onCollapse : undefined
			}),
			h(DSP.IconBtn, {
				icon: 'plus',
				size: 15,
				label: DSP.t('新对话'),
				disabled: busy,
				onClick: function () {
					if (DSP.store.get().ui.chat.streaming) return;
					DSP.store.actions.newChat();
					DSP.store.actions.focusChat();
				}
			}),
			h(DSP.IconBtn, {
				icon: 'trash',
				size: 15,
				label: DSP.t('清空对话'),
				disabled: !p.canClear || busy,
				onClick: typeof p.onClear === 'function' ? p.onClear : undefined
			})
		)
	);
}

var chatHeaderMemo = React.memo(chatHeaderView);

/* ------------------------------------------------------------------ */
/* 上下文 chips                                                        */
/* ------------------------------------------------------------------ */

function chatContextBarView(props) {
	var attachments = props && Array.isArray(props.attachments) ? props.attachments : [];
	if (attachments.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-chat-context', 'aria-label': DSP.t('附加到对话') },
		attachments.map(function (attachment) {
			var remove = function () {
				if (attachment && attachment.id) DSP.store.actions.removeAttachment(attachment.id);
			};
			if (attachment && typeof DSP.renderChatChip === 'function') return DSP.renderChatChip(attachment, remove);
			return h(
				'div',
				{ key: attachment && attachment.id ? attachment.id : 'attachment', className: 'dsp-chat-chip' },
				h('span', { className: 'dsp-chat-chip-label' }, attachment && attachment.type === 'question' ? DSP.t('题目') : DSP.t('选中文字')),
				h(DSP.IconBtn, {
					icon: 'x',
					size: 12,
					label: DSP.t('删除'),
					className: 'dsp-chat-chip-remove',
					onClick: remove
				})
			);
		})
	);
}

var chatContextBarMemo = React.memo(chatContextBarView);

/* ------------------------------------------------------------------ */
/* 输入区                                                              */
/* ------------------------------------------------------------------ */

function chatComposerView(props) {
	var p = props || {};
	var draft = p.draft == null ? '' : String(p.draft);
	var textareaRef = React.useRef(null);
	var streaming = Boolean(p.streaming);
	var hasCourse = Boolean(p.hasCourse);

	React.useEffect(function () {
		var element = textareaRef.current;
		if (!element) return;
		element.style.height = 'auto';
		/* 无边框透明 textarea：单行高度 = 上下 padding 10px + 行高 20px = 30px。 */
		var nextHeight = Math.min(element.scrollHeight || 0, 132);
		element.style.height = (nextHeight > 0 ? nextHeight : 30) + 'px';
	}, [draft]);

	React.useEffect(function () {
		if (!p.focusBump) return;
		var element = textareaRef.current;
		if (!element) return;
		element.focus();
		try {
			var length = element.value.length;
			element.setSelectionRange(length, length);
		} catch (error) {
			/* 某些环境不支持 setSelectionRange，忽略 */
		}
	}, [p.focusBump]);

	function onChange(event) {
		DSP.store.actions.setDraft(event.target.value);
	}

	function onKeyDown(event) {
		if (!event || event.key !== 'Enter') return;
		if (event.shiftKey) return;
		if (event.nativeEvent && event.nativeEvent.isComposing) return;
		event.preventDefault();
		chatSendDraft();
	}

	var canSend = hasCourse && draft.trim().length > 0 && !streaming;
	return h(
		'div',
		{ className: 'dsp-chat-composer' },
		h('textarea', {
			ref: textareaRef,
			className: 'dsp-chat-input',
			value: draft,
			rows: 1,
			placeholder: DSP.t('输入问题'),
			'aria-label': DSP.t('输入问题'),
			disabled: streaming,
			onChange: onChange,
			onKeyDown: onKeyDown
		}),
		h(DSP.Btn, {
			variant: 'primary',
			icon: 'send',
			iconSize: 15,
			loading: streaming,
			disabled: !canSend,
			className: 'dsp-chat-send',
			title: DSP.t('发送'),
			ariaLabel: DSP.t('发送'),
			onClick: chatSendDraft
		})
	);
}

var chatComposerMemo = React.memo(chatComposerView);

/* ------------------------------------------------------------------ */
/* 对话面板                                                            */
/* ------------------------------------------------------------------ */

DSP.ChatPanel = function ChatPanel() {
	var storeState = DSP.useStore(function (state) {
		var courseId = state.ui.courseId;
		var course = (state.data.courses || []).find(function (item) {
			return item.id === courseId;
		}) || null;
		return {
			course: course,
			courseId: courseId,
			chat: state.ui.chat,
			chatMessages: state.chatMessages,
			threads: state.threads
		};
	});

	var chat = storeState.chat || {};
	var course = storeState.course;
	var courseId = storeState.courseId || null;
	var threadId = chat.threadId || null;
	var messageKey = threadId || chatNewThreadKey;
	var messages = storeState.chatMessages[messageKey] || [];
	var threadInfo = threadId ? (storeState.threads || {})[threadId] : null;
	var loading = Boolean(threadInfo && threadInfo.loading);
	var threadError = threadInfo && threadInfo.error ? String(threadInfo.error) : '';
	var streaming = Boolean(chat.streaming);

	var confirmPair = React.useState(false);
	var confirmOpen = confirmPair[0];
	var setConfirmOpen = confirmPair[1];
	var scrollRef = React.useRef(null);
	var lastCourseRef = React.useRef(null);
	var lastExpandBumpRef = React.useRef(null);

	/* 宽度 / 收起 / 视口：纯 UI 状态，只存在组件内 + localStorage，不进 store。 */
	var widthPair = React.useState(function () {
		return chatReadStoredWidth();
	});
	var panelWidth = widthPair[0];
	var setPanelWidth = widthPair[1];
	var collapsedPair = React.useState(function () {
		return chatStorageGet(chatCollapsedStorageKey) === '1';
	});
	var collapsed = collapsedPair[0];
	var setCollapsed = collapsedPair[1];
	var viewportPair = React.useState(function () {
		return (typeof window !== 'undefined' && window.innerWidth) || 1440;
	});
	var viewportWidth = viewportPair[0];
	var setViewportWidth = viewportPair[1];
	var resizingPair = React.useState(false);
	var resizing = resizingPair[0];
	var setResizing = resizingPair[1];
	var dragRef = React.useRef(null);

	React.useEffect(function () {
		function onWindowResize() {
			setViewportWidth((typeof window !== 'undefined' && window.innerWidth) || 1440);
		}
		window.addEventListener('resize', onWindowResize);
		return function () {
			window.removeEventListener('resize', onWindowResize);
		};
	}, []);

	var collapsePanel = React.useCallback(function () {
		setCollapsed(true);
		chatStorageSet(chatCollapsedStorageKey, '1');
	}, []);

	var expandPanel = React.useCallback(function () {
		setCollapsed(false);
		chatStorageRemove(chatCollapsedStorageKey);
	}, []);

	/* 一键提问 / 框选附加后 store 会递增 ui.chat.expandBump：
	 * 若对话区处于收起态则自动展开。ref 记录上次值，首次挂载不误触发。 */
	React.useEffect(function () {
		var bump = Number(chat.expandBump) || 0;
		var previous = lastExpandBumpRef.current;
		lastExpandBumpRef.current = bump;
		if (previous === null) return;
		if (bump <= previous) return;
		if (!collapsed) return;
		expandPanel();
	}, [chat.expandBump, collapsed, expandPanel]);

	/* 左边缘拖拽：pointer capture + 实时宽度；双击恢复默认 384px。 */
	function handleResizePointerDown(event) {
		if (collapsed || !event) return;
		if (event.button !== undefined && event.button !== 0) return;
		var element = event.currentTarget;
		var root = element && element.parentElement ? element.parentElement : null;
		var startWidth = root && typeof root.getBoundingClientRect === 'function' ? root.getBoundingClientRect().width : panelWidth;
		if (!Number.isFinite(startWidth) || startWidth <= 0) startWidth = panelWidth || chatDefaultWidth;
		try {
			if (element && typeof element.setPointerCapture === 'function' && event.pointerId !== undefined) element.setPointerCapture(event.pointerId);
		} catch (error) {
			/* 指针捕获失败时仍可依赖普通 pointermove */
		}
		dragRef.current = {
			pointerId: event.pointerId,
			startX: typeof event.clientX === 'number' ? event.clientX : 0,
			startWidth: Math.round(startWidth),
			lastWidth: Math.round(startWidth)
		};
		setResizing(true);
		if (typeof event.preventDefault === 'function') event.preventDefault();
	}

	function handleResizePointerMove(event) {
		var drag = dragRef.current;
		if (!drag || !event) return;
		if (drag.pointerId !== undefined && event.pointerId !== undefined && drag.pointerId !== event.pointerId) return;
		var clientX = typeof event.clientX === 'number' ? event.clientX : drag.startX;
		var windowWidth = (typeof window !== 'undefined' && window.innerWidth) || viewportWidth;
		var nextWidth = chatClampWidth(drag.startWidth + (drag.startX - clientX), windowWidth);
		drag.lastWidth = nextWidth;
		setPanelWidth(nextWidth);
		if (typeof event.preventDefault === 'function') event.preventDefault();
	}

	function handleResizePointerUp(event) {
		var drag = dragRef.current;
		if (!drag) return;
		dragRef.current = null;
		setResizing(false);
		try {
			if (event && event.currentTarget && typeof event.currentTarget.releasePointerCapture === 'function' && event.pointerId !== undefined) {
				event.currentTarget.releasePointerCapture(event.pointerId);
			}
		} catch (error) {
			/* 释放指针捕获失败忽略 */
		}
		chatStorageSet(chatWidthStorageKey, drag.lastWidth || drag.startWidth);
	}

	function handleResizeDoubleClick(event) {
		if (event && typeof event.preventDefault === 'function') event.preventDefault();
		setPanelWidth(null);
		chatStorageRemove(chatWidthStorageKey);
	}

	var effectiveWidth = collapsed ? chatCollapsedWidth : chatClampWidth(panelWidth === null ? chatDefaultWidth : panelWidth, viewportWidth);

	/* 课程变化时自动加载最近一条对话线程（仅当当前未指定线程）。
	 * 若旧课程选中的线程不属于新课程，先重置为全新对话，避免跨课程串上下文。 */
	React.useEffect(function () {
		var previousCourseId = lastCourseRef.current;
		lastCourseRef.current = courseId;
		if (!courseId || previousCourseId === courseId) return;
		if (!course) return;
		var threads = Array.isArray(course.chatThreads) ? course.chatThreads : [];
		var activeThreadId = DSP.store.get().ui.chat.threadId;
		if (activeThreadId) {
			var belongsToCourse = threads.some(function (thread) {
				return thread && thread.id === activeThreadId;
			});
			if (!belongsToCourse) {
				DSP.store.actions.newChat();
				activeThreadId = null;
			}
		}
		if (!activeThreadId && threads.length > 0) {
			DSP.store.actions.selectThread(threads[0].id);
		}
	}, [courseId, course]);

	/* 始终滚动到底部；pending 变化时跟随流式输出。 */
	React.useEffect(function () {
		var element = scrollRef.current;
		if (!element) return;
		element.scrollTop = element.scrollHeight;
	}, [messages.length, chat.pending, streaming, threadId]);

	var requestClear = React.useCallback(function () {
		if (DSP.store.get().ui.chat.streaming) return;
		setConfirmOpen(true);
	}, []);
	var closeConfirm = React.useCallback(function () {
		setConfirmOpen(false);
	}, []);
	var applyClear = React.useCallback(function () {
		setConfirmOpen(false);
		DSP.store.actions.clearChat().then(function () {
			DSP.store.actions.toast(DSP.t('已清空对话'), 'success');
		}).catch(function (error) {
			DSP.store.actions.toast(error && error.message ? error.message : DSP.t('清空对话失败'), 'error');
		});
	}, []);

	var canClear = Boolean(course) && !streaming && Boolean(threadId) && messages.length > 0;

	var modal = confirmOpen
		? h(
			DSP.Modal,
			{
				open: true,
				title: DSP.t('清空对话'),
				onClose: closeConfirm,
				footer: [
					h(DSP.Btn, { key: 'cancel', variant: 'ghost', onClick: closeConfirm }, DSP.t('取消')),
					h(DSP.Btn, { key: 'confirm', variant: 'danger', onClick: applyClear }, DSP.t('确认'))
				]
			},
			h('div', { className: 'dsp-chat-confirm-text' }, DSP.t('清空后当前对话的消息将无法恢复，确定继续吗？'))
		)
		: null;

	/* 收起态：约 44px 窄竖条，只留展开按钮 + 竖排标题。 */
	if (collapsed) {
		return h(
			'aside',
			{
				className: 'dsp-chat dsp-chat-collapsed',
				style: { width: chatCollapsedWidth + 'px' },
				role: 'complementary',
				'aria-label': DSP.t('答疑助手')
			},
			h(
				'button',
				{
					type: 'button',
					className: 'dsp-chat-expand',
					title: DSP.t('展开对话'),
					'aria-label': DSP.t('展开对话'),
					onClick: expandPanel
				},
				h(DSP.Icon, { name: 'chevronLeft', size: 15 }),
				h('span', { className: 'dsp-chat-collapsed-title' }, DSP.t('答疑助手'))
			)
		);
	}

	return h(
		'aside',
		{
			className: 'dsp-chat' + (resizing ? ' dsp-chat-resizing' : ''),
			style: { width: effectiveWidth + 'px' },
			role: 'complementary',
			'aria-label': DSP.t('答疑助手')
		},
		h('div', {
			className: 'dsp-chat-resize-handle' + (resizing ? ' dsp-chat-resize-active' : ''),
			role: 'separator',
			'aria-orientation': 'vertical',
			'aria-label': DSP.t('拖动调整对话区宽度'),
			title: DSP.t('拖动调整对话区宽度，双击恢复默认'),
			onPointerDown: handleResizePointerDown,
			onPointerMove: handleResizePointerMove,
			onPointerUp: handleResizePointerUp,
			onPointerCancel: handleResizePointerUp,
			onDoubleClick: handleResizeDoubleClick
		}),
		h(chatHeaderMemo, {
			courseName: course ? course.name : '',
			canClear: canClear,
			streaming: streaming,
			onClear: requestClear,
			onCollapse: collapsePanel
		}),
		h(chatContextBarMemo, { attachments: chat.attachments || [] }),
		h(
			'div',
			{ className: 'dsp-chat-scroll', ref: scrollRef },
			threadError
				? h(
					'div',
					{ className: 'dsp-chat-banner-error' },
					h(DSP.Icon, { name: 'alert', size: 14 }),
					h('span', { className: 'dsp-chat-banner-text' }, DSP.t('加载对话失败') + '：' + threadError),
					h(DSP.Btn, {
						variant: 'ghost',
						className: 'dsp-btn-sm',
						onClick: function () {
							if (threadId) DSP.store.actions.selectThread(threadId);
						}
					}, DSP.t('重试'))
				)
				: null,
			loading && messages.length === 0
				? h(
					'div',
					{ className: 'dsp-chat-fill' },
					h(
						'div',
						{ className: 'dsp-chat-loading' },
						h(DSP.Spinner, { size: 16 }),
						h('span', null, DSP.t('正在加载对话') + '…')
					)
				)
				: messages.length === 0
					? h('div', { className: 'dsp-chat-fill' }, h(chatEmptyMemo, { hasCourse: Boolean(course) }))
					: h(chatHistoryMemo, { messages: messages }),
			h(chatPendingMemo, { pending: chat.pending || '', streaming: streaming })
		),
		h(chatComposerMemo, {
			draft: chat.draft || '',
			streaming: streaming,
			focusBump: chat.focusBump || 0,
			hasCourse: Boolean(course)
		}),
		modal
	);
};

/* ==== src/client/60-dash.js ==== */
/* 刷题模式 Client — 课程学情看板（course-ui-dev）。
 * 统计卡 / 题型正确率 / 最近 7 天趋势 / 易错题 / AI 学情分析与复习方案。
 * 依赖 store：课程数据来自 bootstrap；题目 type 与题干通过 actions.loadSet 懒加载并缓存。
 */

const DASH_TYPE_ORDER = ['single', 'multiple', 'judge', 'fill', 'short', 'other'];
const DASH_TYPE_SET_LIMIT = 8;
const DASH_WRONG_LIMIT = 10;

function dashTypeLabel(type) {
	if (type === 'single') return DSP.t('单选');
	if (type === 'multiple') return DSP.t('多选');
	if (type === 'judge') return DSP.t('判断');
	if (type === 'fill') return DSP.t('填空');
	if (type === 'short') return DSP.t('简答');
	return DSP.t('其他');
}

function dashPad2(number) {
	return number < 10 ? '0' + number : String(number);
}

function dashDayKey(timestamp) {
	const date = new Date(Number(timestamp));
	if (Number.isNaN(date.getTime())) return '';
	return date.getFullYear() + '-' + dashPad2(date.getMonth() + 1) + '-' + dashPad2(date.getDate());
}

/* 连续复习天数：以今天（或昨天）为起点向前数连续有作答的日期。 */
function dashStreakDays(records) {
	const days = new Set();
	(records || []).forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (key) days.add(key);
	});
	if (days.size === 0) return 0;
	const cursor = new Date();
	cursor.setHours(0, 0, 0, 0);
	if (!days.has(dashDayKey(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
	let streak = 0;
	while (days.has(dashDayKey(cursor.getTime()))) {
		streak += 1;
		cursor.setDate(cursor.getDate() - 1);
	}
	return streak;
}

/* 最近 N 天（含今天）每天作答数。 */
function dashRecentDays(records, count) {
	const total = count || 7;
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const days = [];
	const index = new Map();
	for (let offset = total - 1; offset >= 0; offset -= 1) {
		const day = new Date(today.getTime());
		day.setDate(day.getDate() - offset);
		const bucket = { key: dashDayKey(day.getTime()), label: day.getMonth() + 1 + '/' + day.getDate(), count: 0 };
		days.push(bucket);
		index.set(bucket.key, bucket);
	}
	(records || []).forEach(function (record) {
		const bucket = index.get(dashDayKey(record && record.at));
		if (bucket) bucket.count += 1;
	});
	return days;
}

/* 最近作答里做错的题目（去重后按时间倒序）。 */
function dashWrongRecords(course) {
	const latest = DSP.latestRecords((course && course.records) || []);
	return latest
		.filter(function (record) {
			return record && record.correct === false;
		})
		.sort(function (left, right) {
			return (Number(right.at) || 0) - (Number(left.at) || 0);
		})
		.slice(0, DASH_WRONG_LIMIT);
}

function dashCourseSetIds(course) {
	const order = new Map();
	((course && course.sets) || []).forEach(function (set, position) {
		order.set(set.id, position);
	});
	const seen = new Set();
	const ids = [];
	((course && course.records) || []).forEach(function (record) {
		if (!record || !record.setId || seen.has(record.setId)) return;
		seen.add(record.setId);
		ids.push(record.setId);
	});
	ids.sort(function (left, right) {
		const leftPosition = order.has(left) ? order.get(left) : 9999;
		const rightPosition = order.has(right) ? order.get(right) : 9999;
		return leftPosition - rightPosition;
	});
	return ids;
}

/* 需要懒加载 set.json 的套题：题型统计最多前 8 套 + 易错题所在套题。 */
function dashSetPlan(course) {
	const typeSetIds = dashCourseSetIds(course).slice(0, DASH_TYPE_SET_LIMIT);
	const wrong = dashWrongRecords(course);
	const neededSetIds = typeSetIds.slice();
	wrong.forEach(function (record) {
		if (record.setId && neededSetIds.indexOf(record.setId) < 0) neededSetIds.push(record.setId);
	});
	return { typeSetIds: typeSetIds, neededSetIds: neededSetIds, wrong: wrong, key: neededSetIds.join('|') };
}

/* 题型正确率：records（每题最近一次）+ set.json 的 question.type。 */
function dashTypeStats(latest, setCache, setIds) {
	const typeByQuestion = new Map();
	(setIds || []).forEach(function (setId) {
		const entry = setCache ? setCache[setId] : null;
		const data = entry && entry.data;
		if (!data || !Array.isArray(data.questions)) return;
		data.questions.forEach(function (question) {
			if (!question || question.id === undefined || question.id === null) return;
			typeByQuestion.set(String(setId) + '/' + String(question.id), question.type || 'other');
		});
	});
	const buckets = new Map();
	(latest || []).forEach(function (record) {
		if (!record || (record.correct !== true && record.correct !== false)) return;
		const type = typeByQuestion.get(String(record.setId || '') + '/' + String(record.questionId || ''));
		if (!type) return;
		const key = DASH_TYPE_ORDER.indexOf(type) >= 0 ? type : 'other';
		const bucket = buckets.get(key) || { type: key, judged: 0, correct: 0 };
		bucket.judged += 1;
		if (record.correct === true) bucket.correct += 1;
		buckets.set(key, bucket);
	});
	const stats = [];
	DASH_TYPE_ORDER.forEach(function (type) {
		const bucket = buckets.get(type);
		if (!bucket) return;
		stats.push({ type: type, total: bucket.judged, correct: bucket.correct, accuracy: bucket.judged > 0 ? bucket.correct / bucket.judged : 0 });
	});
	return stats;
}

function dashSetTitle(course, setId) {
	const set = ((course && course.sets) || []).find(function (item) {
		return item.id === setId;
	});
	return set && set.title ? set.title : DSP.t('未命名套题');
}

function dashAnalysisError(failure) {
	return failure && failure.message ? String(failure.message) : String(failure || DSP.t('操作失败'));
}

/* ------------------------------------------------------------------ */
/* 活跃度热力图（GitHub 贡献图风格，16 周 × 7 天）                       */
/* ------------------------------------------------------------------ */

const DASH_HEAT_WEEKS = 16;

/* 最近 16 周的周网格：列=周，行=周一~周日；未来日期标记 future。 */
function dashHeatmapWeeks() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayTime = today.getTime();
	const mondayOffset = (today.getDay() + 6) % 7;
	const currentMonday = new Date(todayTime);
	currentMonday.setDate(currentMonday.getDate() - mondayOffset);
	const firstMonday = new Date(currentMonday.getTime());
	firstMonday.setDate(firstMonday.getDate() - (DASH_HEAT_WEEKS - 1) * 7);
	const weeks = [];
	for (let weekIndex = 0; weekIndex < DASH_HEAT_WEEKS; weekIndex += 1) {
		const days = [];
		for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
			const date = new Date(firstMonday.getTime());
			date.setDate(date.getDate() + weekIndex * 7 + dayIndex);
			const time = date.getTime();
			days.push({ key: dashDayKey(time), time: time, future: time > todayTime, count: 0 });
		}
		weeks.push(days);
	}
	return weeks;
}

/* 每日作答次数 → 0~4 五档。 */
function dashHeatLevel(count) {
	if (!count || count <= 0) return 0;
	if (count === 1) return 1;
	if (count <= 3) return 2;
	if (count <= 6) return 3;
	return 4;
}

/* 共享组件：records 需传入「每题最新记录」；课程看板与全局看板共用。 */
function DashActivityHeatmap(props) {
	const records = props.records || [];
	const weeks = dashHeatmapWeeks();
	const counts = new Map();
	records.forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (!key) return;
		counts.set(key, (counts.get(key) || 0) + 1);
	});
	let activeDays = 0;
	let totalCount = 0;
	const cells = [];
	weeks.forEach(function (days, weekIndex) {
		days.forEach(function (day, dayIndex) {
			const count = day.future ? 0 : counts.get(day.key) || 0;
			day.count = count;
			if (count > 0) {
				activeDays += 1;
				totalCount += count;
			}
			const level = day.future ? 0 : dashHeatLevel(count);
			cells.push(
				h('span', {
					key: 'c' + weekIndex + '-' + dayIndex,
					className:
						'dsp-dash-heat-cell dsp-dash-heat-cell-l' +
						String(level) +
						(day.future ? ' dsp-dash-heat-cell-future' : ''),
					title: day.future ? undefined : day.key + ' · ' + String(count) + ' ' + DSP.t('题')
				})
			);
		});
	});
	const summary =
		totalCount > 0
			? DSP.t('最近 16 周共') +
				' ' +
				String(activeDays) +
				' ' +
				DSP.t('天有刷题') +
				' / ' +
				DSP.t('累计') +
				' ' +
				String(totalCount) +
				' ' +
				DSP.t('次')
			: '';
	return h(
		'div',
		{ className: 'dsp-card dsp-dash-heat-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8' },
				h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'chart', size: 16 })),
				h('h2', { className: 'dsp-section-title' }, DSP.t('活跃度'))
			),
			summary ? h('span', { className: 'dsp-small dsp-faint' }, summary) : null
		),
		totalCount === 0
			? h(DSP.Empty, { icon: 'chart', title: DSP.t('最近 16 周还没有刷题记录') }, DSP.t('完成练习后，这里会显示每日活跃度。'))
			: h(
					'div',
					{ className: 'dsp-dash-heat-wrap' },
					h('div', { className: 'dsp-dash-heat-grid' }, cells),
					h(
						'div',
						{ className: 'dsp-dash-heat-legend' },
						h('span', { className: 'dsp-dash-heat-legend-label' }, DSP.t('少')),
						[0, 1, 2, 3, 4].map(function (level) {
							return h('span', { key: 'legend-' + level, className: 'dsp-dash-heat-swatch dsp-dash-heat-cell-l' + String(level) });
						}),
						h('span', { className: 'dsp-dash-heat-legend-label' }, DSP.t('多'))
					)
				)
	);
}

function DashStatCard(props) {
	return h(
		'div',
		{ className: 'dsp-stat-card' + (props.tone ? ' dsp-stat-card-' + props.tone : '') },
		h(
			'div',
			{ className: 'dsp-stat-top' },
			h('span', { className: 'dsp-stat-icon' }, h(DSP.Icon, { name: props.icon, size: 15 })),
			h('span', { className: 'dsp-stat-label' }, props.label)
		),
		h('div', { className: 'dsp-stat-value' }, props.value),
		props.hint ? h('div', { className: 'dsp-stat-hint' }, props.hint) : null
	);
}

function DashTypeBars(props) {
	const stats = props.stats || [];
	if (props.loading) {
		return h(
			'div',
			{ className: 'dsp-bars dsp-bars-skeleton', 'aria-hidden': 'true' },
			[0, 1, 2, 3].map(function (row) {
				return h(
					'div',
					{ key: row, className: 'dsp-bar-row' },
					h('span', { className: 'dsp-skeleton dsp-skeleton-label' }),
					h('span', { className: 'dsp-bar-track' }, h('span', { className: 'dsp-skeleton dsp-skeleton-fill', style: { width: 72 - row * 14 + '%' } })),
					h('span', { className: 'dsp-skeleton dsp-skeleton-value' })
				);
			})
		);
	}
	if (stats.length === 0) {
		return h(
			DSP.Empty,
			{ icon: 'target', title: DSP.t('还没有数据') },
			DSP.t('完成练习后，这里会按题型显示正确率。')
		);
	}
	return h(
		'div',
		{ className: 'dsp-bars' },
		stats.map(function (stat) {
			const tone = stat.accuracy >= 0.8 ? 'good' : stat.accuracy < 0.5 ? 'bad' : '';
			return h(
				'div',
				{ key: stat.type, className: 'dsp-bar-row' },
				h(
					'span',
					{ className: 'dsp-bar-label' },
					dashTypeLabel(stat.type),
					h('span', { className: 'dsp-bar-label-count' }, String(stat.total))
				),
				h(
					'span',
					{ className: 'dsp-bar-track' },
					h('span', {
						className: 'dsp-bar-fill' + (tone ? ' dsp-bar-fill-' + tone : ''),
						style: { width: Math.max(2, Math.min(100, stat.accuracy * 100)) + '%' }
					})
				),
				h('span', { className: 'dsp-bar-value' }, DSP.fmtPct(stat.accuracy))
			);
		})
	);
}

function DashTrendChart(props) {
	const days = props.days || [];
	const total = days.reduce(function (sum, day) { return sum + day.count; }, 0);
	if (total === 0) {
		return h(
			DSP.Empty,
			{ icon: 'chart', title: DSP.t('还没有数据') },
			DSP.t('完成练习后，这里会显示最近 7 天的作答趋势。')
		);
	}
	const width = 680;
	const height = 200;
	const padding = { top: 20, right: 12, bottom: 30, left: 12 };
	const innerWidth = width - padding.left - padding.right;
	const innerHeight = height - padding.top - padding.bottom;
	const maxValue = days.reduce(function (max, day) { return Math.max(max, day.count); }, 1);
	const step = innerWidth / days.length;
	const barWidth = Math.max(12, Math.min(48, step * 0.5));
	const baseline = padding.top + innerHeight;
	const nodes = [];
	nodes.push(h('line', { key: 'grid', className: 'dsp-trend-grid', x1: padding.left, y1: padding.top, x2: width - padding.right, y2: padding.top }));
	nodes.push(h('line', { key: 'axis', className: 'dsp-trend-axis', x1: padding.left, y1: baseline, x2: width - padding.right, y2: baseline }));
	days.forEach(function (day, index) {
		const x = padding.left + step * index + (step - barWidth) / 2;
		const ratio = maxValue > 0 ? day.count / maxValue : 0;
		const barHeight = day.count > 0 ? Math.max(4, ratio * innerHeight) : 2;
		const y = baseline - barHeight;
		const isToday = index === days.length - 1;
		nodes.push(
			h(
				'g',
				{ key: day.key },
				h('rect', {
					className: 'dsp-trend-bar' + (day.count > 0 ? '' : ' dsp-trend-bar-empty') + (isToday ? ' dsp-trend-bar-today' : ''),
					x: x,
					y: y,
					width: barWidth,
					height: barHeight,
					rx: Math.min(4, barWidth / 2)
				}),
				day.count > 0
					? h('text', { className: 'dsp-trend-value', x: x + barWidth / 2, y: y - 7, textAnchor: 'middle' }, String(day.count))
					: null,
				h('text', { className: 'dsp-trend-label' + (isToday ? ' dsp-trend-label-today' : ''), x: x + barWidth / 2, y: height - 9, textAnchor: 'middle' }, isToday ? DSP.t('今天') : day.label)
			)
		);
	});
	return h(
		'svg',
		{
			className: 'dsp-trend-svg',
			viewBox: '0 0 ' + width + ' ' + height,
			role: 'img',
			'aria-label': DSP.t('最近 7 天作答趋势')
		},
		nodes
	);
}

function DashAnalysisCard(props) {
	const job = props.job;
	const running = Boolean(job && job.status === 'running');
	const fraction = running ? courseUiProgressFraction(job.progress) : 0;
	const markdown = props.markdown || '';
	const disabled = running || Boolean(props.disabled);
	const generateButton = h(
		DSP.Btn,
		{
			variant: markdown ? 'secondary' : 'primary',
			icon: markdown ? 'refresh' : 'sparkles',
			loading: running,
			disabled: disabled,
			title: props.disabled ? DSP.t('暂无可分析的数据') : undefined,
			onClick: props.onGenerate
		},
		markdown ? DSP.t('刷新分析') : DSP.t('生成学情分析')
	);
	return h(
		'div',
		{ className: 'dsp-card dsp-analysis-card' },
		h(
			'div',
			{ className: 'dsp-section-head' },
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8' },
				h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'sparkles', size: 16 })),
				h('h2', { className: 'dsp-section-title' }, props.title),
				markdown ? h(DSP.Tag, { tone: 'brand' }, DSP.t('AI 生成')) : null
			),
			h(
				'div',
				{ className: 'dsp-row dsp-gap-8 dsp-analysis-head-actions' },
				markdown && props.generatedAt ? h('span', { className: 'dsp-small dsp-faint' }, DSP.t('生成于') + ' ' + DSP.fmtDate(props.generatedAt)) : null,
				markdown || running ? generateButton : null
			)
		),
		running
			? h(
					'div',
					{ className: 'dsp-dash-analysis-progress' },
					h('div', { className: 'dsp-row dsp-gap-8 dsp-small dsp-muted' }, h(DSP.Spinner, { size: 14 }), h('span', null, job.message || DSP.t('正在生成'))),
					fraction > 0 ? h(DSP.ProgressBar, { value: fraction }) : null
				)
			: markdown
				? h('div', { className: 'dsp-md dsp-analysis-md' }, DSP.markdown(markdown))
				: h(
						DSP.Empty,
						{
							icon: 'bulb',
							title: props.emptyTitle || DSP.t('还没有学情分析'),
							action: h(
								DSP.Btn,
								{
									variant: 'primary',
									icon: 'sparkles',
									loading: running,
									disabled: disabled,
									title: props.disabled ? DSP.t('暂无可分析的数据') : undefined,
									onClick: props.onGenerate
								},
								DSP.t('生成学情分析')
							)
						},
						props.emptyText || DSP.t('结合作答记录与题目解析生成学情分析与复习方案。')
					)
	);
}

/* 课程级看板。 */
function CourseDashboardView() {
	const storeState = DSP.useStore(function (state) {
		const courses = state.data.courses || [];
		return {
			course: courses.find(function (item) { return item.id === state.ui.courseId; }) || null,
			setCache: state.setCache || {},
			analysisJob: state.ui.analysisJob || null,
			loading: state.loading
		};
	});
	const course = storeState.course;
	const setCache = storeState.setCache || {};
	const courseId = course ? course.id : null;
	const plan = course ? dashSetPlan(course) : { typeSetIds: [], neededSetIds: [], wrong: [], key: '' };
	const neededKey = plan.key;

	React.useEffect(
		function () {
			if (!course || plan.neededSetIds.length === 0) return;
			const cache = DSP.store.get().setCache || {};
			plan.neededSetIds.forEach(function (setId) {
				const entry = cache[setId];
				if (entry && (entry.loading || entry.data || entry.error)) return;
				DSP.store.actions.loadSet(course.id, setId).catch(function () {});
			});
		},
		[courseId, neededKey]
	);

	function loadTopicSets() {
		if (!course) return;
		const cache = DSP.store.get().setCache || {};
		plan.neededSetIds.forEach(function (setId) {
			const entry = cache[setId];
			if (entry && (entry.loading || entry.data)) return;
			DSP.store.actions.loadSet(course.id, setId).catch(function () {});
		});
	}

	if (!course) {
		return h(
			'div',
			{ className: 'dsp-page dsp-dash-page' },
			h(
				'div',
				{ className: 'dsp-page-head' },
				h(
					'div',
					{ className: 'dsp-col dsp-gap-6' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('课程看板'))
				)
			),
			h(
				'div',
				{ className: 'dsp-scroll' },
				h(
					'div',
					{ className: 'dsp-page-body' },
					h(
						'div',
						{ className: 'dsp-card' },
						h(
							DSP.Empty,
							{
								icon: 'chart',
								title: DSP.t('暂无课程'),
								action: h(
									DSP.Btn,
									{ variant: 'primary', icon: 'chart', onClick: function () { DSP.store.actions.openGlobalDash(); } },
									DSP.t('所有课程看板')
								)
							},
							DSP.t('新建课程并完成练习后，这里会显示课程学情看板。')
						)
					)
				)
			)
		);
	}

	const records = course.records || [];
	const latest = DSP.latestRecords(records);
	const sets = course.sets || [];
	const accuracy = DSP.accuracyOf(latest);
	const completedSets = sets.filter(function (set) { return Boolean(set.completedAt); }).length;
	const streak = dashStreakDays(records);
	const analysis = course.analyses && course.analyses.course ? course.analyses.course : null;
	const analysisJob = storeState.analysisJob && storeState.analysisJob.scope === 'course' ? storeState.analysisJob : null;
	const analysisRunning = Boolean(analysisJob && analysisJob.status === 'running');
	const typeLoading = plan.typeSetIds.some(function (setId) {
		const entry = setCache[setId];
		return !entry || entry.loading;
	});
	const typeLoadFailed = plan.typeSetIds.some(function (setId) {
		const entry = setCache[setId];
		return Boolean(entry && entry.error);
	});
	const typeStats = dashTypeStats(latest, setCache, plan.typeSetIds);
	const trendDays = dashRecentDays(records, 7);
	const wrongItems = plan.wrong.map(function (record) {
		const entry = setCache[record.setId];
		const setData = entry && entry.data;
		const questions = setData && Array.isArray(setData.questions) ? setData.questions : null;
		let question = null;
		let questionIndex = -1;
		if (questions) {
			for (let index = 0; index < questions.length; index += 1) {
				if (String(questions[index].id) === String(record.questionId)) {
					question = questions[index];
					questionIndex = index;
					break;
				}
			}
		}
		const number = question && question.number !== undefined && question.number !== null ? question.number : questionIndex >= 0 ? questionIndex + 1 : null;
		const stem = question && question.stem ? String(question.stem) : '';
		const wrongCount = records.filter(function (item) {
			return item && item.setId === record.setId && String(item.questionId) === String(record.questionId) && item.correct === false;
		}).length;
		return {
			record: record,
			setTitle: dashSetTitle(course, record.setId),
			number: number,
			stem: stem,
			questionIndex: questionIndex,
			loaded: Boolean(questions),
			loadError: Boolean(entry && entry.error),
			wrongCount: wrongCount
		};
	});

	function generateAnalysis() {
		Promise.resolve(DSP.store.actions.diagnose('course')).catch(function (failure) {
			DSP.store.actions.toast(dashAnalysisError(failure), 'error');
		});
	}

	function openWrongItem(item) {
		DSP.store.actions.openPractice(course.id, item.record.setId);
		if (item.questionIndex >= 0) DSP.store.actions.ui({ questionIndex: item.questionIndex });
	}

	return h(
		'div',
		{ className: 'dsp-page dsp-dash-page' },
		h(
			'div',
			{ className: 'dsp-page-head dsp-dash-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-dash-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-dash-title-row' },
					h(DSP.IconBtn, {
						icon: 'arrowLeft',
						label: DSP.t('返回课程主页'),
						title: DSP.t('返回课程主页'),
						onClick: function () { DSP.store.actions.openCourse(course.id); }
					}),
					h(
						'h1',
						{ className: 'dsp-page-title' },
						h('span', { className: 'dsp-truncate', title: course.name || '' }, course.name || DSP.t('未命名课程')),
						h(DSP.Tag, { tone: 'brand' }, DSP.t('学情看板'))
					)
				),

			),
			h(
				'div',
				{ className: 'dsp-dash-head-actions' },
				h(
					DSP.Btn,
					{
						variant: 'secondary',
						icon: 'book',
						onClick: function () { DSP.store.actions.openCourse(course.id); }
					},
					DSP.t('返回课程主页')
				),
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'sparkles',
						loading: analysisRunning,
						disabled: analysisRunning,
						onClick: generateAnalysis
					},
					analysis && analysis.markdown ? DSP.t('刷新学习分析') : DSP.t('生成学习分析')
				)
			)
		),
		h(
			'div',
			{ className: 'dsp-scroll' },
			h(
				'div',
				{ className: 'dsp-page-body dsp-dash-body' },
				h(
					'div',
					{ className: 'dsp-stats' },
					h(DashStatCard, { icon: 'list', label: DSP.t('刷题次数'), value: String(latest.length) }),
					h(DashStatCard, { icon: 'target', label: DSP.t('正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy), tone: 'brand' }),
					h(DashStatCard, { icon: 'checkCircle', label: DSP.t('已完成套数'), value: String(completedSets), tone: 'success' }),
					h(DashStatCard, { icon: 'clock', label: DSP.t('连续复习天数'), value: String(streak), tone: 'warn' })
				),
				h(
					'div',
					{ className: 'dsp-dash-grid' },
					h(
						'div',
						{ className: 'dsp-card dsp-dash-type-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'target', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('题型正确率'))
							),
							typeLoading
								? h(DSP.Spinner, { size: 14 })
								: typeLoadFailed
									? h(
											DSP.Btn,
											{
												variant: 'ghost',
												icon: 'refresh',
												className: 'dsp-btn-sm',
												onClick: loadTopicSets
											},
											DSP.t('重新加载题目')
										)
									: null
						),
						h(DashTypeBars, { stats: typeStats, loading: typeLoading })
					),
					h(
						'div',
						{ className: 'dsp-card dsp-trend-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'chart', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('最近 7 天趋势'))
							)
						),
						h(DashTrendChart, { days: trendDays })
					)
				),
				h(DashActivityHeatmap, { records: latest }),
				h(
					'div',
					{ className: 'dsp-dash-bottom' },
					h(
						'div',
						{ className: 'dsp-card dsp-wrong-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'alert', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('易错题')),
								wrongItems.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(wrongItems.length)) : null
							)
						),
						wrongItems.length === 0
							? h(DSP.Empty, { icon: 'checkCircle', title: DSP.t('暂无错题') }, DSP.t('继续保持，最近没有做错的题目。'))
							: h(
									'div',
									{ className: 'dsp-wrong-list' },
									wrongItems.map(function (item) {
										const stemText = item.stem.length > 80 ? item.stem.slice(0, 80) + '…' : item.stem;
										return h(
											'button',
											{
												key: String(item.record.id || item.record.setId + '/' + item.record.questionId),
												type: 'button',
												className: 'dsp-wrong-item',
												onClick: function () { openWrongItem(item); }
											},
											h(
												'span',
												{ className: 'dsp-wrong-head' },
												h('span', { className: 'dsp-wrong-set dsp-truncate' }, item.setTitle),
												item.number === null ? null : h('span', { className: 'dsp-wrong-index' }, '· ' + DSP.t('第') + String(item.number) + DSP.t('题')),
												h('span', { className: 'dsp-wrong-count' }, '· ' + DSP.t('错误') + ' ' + String(item.wrongCount) + ' ' + DSP.t('次'))
											),
											h(
												'span',
												{ className: 'dsp-wrong-stem' },
												stemText || (item.loaded ? DSP.t('无题干') : item.loadError ? DSP.t('题目加载失败') : DSP.t('正在加载题目…'))
											),
											h('span', { className: 'dsp-wrong-meta' }, DSP.fmtShortDate(item.record.at))
										);
									})
								)
					),
					h(DashAnalysisCard, {
						title: DSP.t('学情分析与复习方案'),
						markdown: analysis && analysis.markdown ? analysis.markdown : '',
						generatedAt: analysis && analysis.generatedAt ? analysis.generatedAt : null,
						job: analysisJob,
						onGenerate: generateAnalysis,
						emptyTitle: DSP.t('还没有学情分析'),
						emptyText: DSP.t('基于作答记录、题型分布与易错题生成学情分析和复习方案。')
					})
				)
			)
		)
	);
}

DSP.DashActivityHeatmap = DashActivityHeatmap;
DSP.CourseDashboard = CourseDashboardView;

/* ==== src/client/61-global-dash.js ==== */
/* 刷题模式 Client — 所有课程看板（course-ui-dev）。
 * 汇总统计 / 课程对比 / 最近活动 / 全局 AI 学情分析与建议。
 * 依赖 60-dash.js 中的 DashStatCard、DashAnalysisCard、dashDayKey 等共享工具。
 */

function globalDashActivities(courses) {
	const activities = [];
	(courses || []).forEach(function (course) {
		const setTitles = new Map();
		(course.sets || []).forEach(function (set) {
			setTitles.set(set.id, set.title || '');
		});
		(course.records || []).forEach(function (record) {
			if (!record) return;
			activities.push({
				id: record.id,
				courseId: course.id,
				courseName: course.name || '',
				setTitle: setTitles.get(record.setId) || '',
				correct: record.correct,
				at: Number(record.at) || 0
			});
		});
	});
	activities.sort(function (left, right) {
		return right.at - left.at;
	});
	return activities.slice(0, 15);
}

function globalDashActiveDays(records) {
	const days = new Set();
	(records || []).forEach(function (record) {
		const key = dashDayKey(record && record.at);
		if (key) days.add(key);
	});
	return days.size;
}

/* 课程卡片「最近更新」：取课程/套题/文档/作答记录里的最大时间戳。 */
function globalDashRecentAt(course) {
	let latest = Number(course.updatedAt) || Number(course.createdAt) || 0;
	(course.sets || []).forEach(function (set) {
		latest = Math.max(latest, Number(set.updatedAt) || 0);
	});
	(course.docs || []).forEach(function (doc) {
		latest = Math.max(latest, Number(doc.addedAt) || 0);
	});
	(course.records || []).forEach(function (record) {
		latest = Math.max(latest, Number(record.at) || 0);
	});
	return latest;
}

function GlobalDashboardView() {
	const storeState = DSP.useStore(function (state) {
		return {
			courses: state.data.courses || [],
			global: state.data.global || { analysis: null },
			analysisJob: state.ui.analysisJob || null,
			courseId: state.ui.courseId,
			loading: state.loading
		};
	});
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	const courses = storeState.courses || [];
	const globalAnalysis = storeState.global && storeState.global.analysis ? storeState.global.analysis : null;
	const analysisJob = storeState.analysisJob && storeState.analysisJob.scope === 'global' ? storeState.analysisJob : null;
	const analysisRunning = Boolean(analysisJob && analysisJob.status === 'running');
	const allRecords = [];
	const mergedLatest = [];
	courses.forEach(function (course) {
		(course.records || []).forEach(function (record) {
			if (record) allRecords.push(record);
		});
		/* 全局活跃度/统计按「每个课程内每题最新记录」后合并。 */
		DSP.latestRecords(course.records || []).forEach(function (record) {
			mergedLatest.push(record);
		});
	});
	const latestAll = mergedLatest;
	const accuracy = DSP.accuracyOf(latestAll);
	const activeDays = globalDashActiveDays(allRecords);
	const courseRows = courses.map(function (course) {
		const sets = course.sets || [];
		const latest = DSP.latestRecords(course.records || []);
		const questionTotal = sets.reduce(function (sum, set) {
			return sum + (Number(set.questionCount) || 0);
		}, 0);
		return {
			course: course,
			description: course.description || '',
			setCount: sets.length,
			questionTotal: questionTotal,
			answered: latest.length,
			accuracy: DSP.accuracyOf(latest),
			recentAt: globalDashRecentAt(course)
		};
	});
	const activities = globalDashActivities(courses);

	function openGlobalAnalysis() {
		if (analysisRunning) return;
		Promise.resolve(DSP.store.actions.diagnose('global')).catch(function (failure) {
			DSP.store.actions.toast(dashAnalysisError(failure), 'error');
		});
	}

	return h(
		'div',
		{ className: 'dsp-page dsp-dash-page dsp-global-page' },
		h(
			'div',
			{ className: 'dsp-page-head dsp-dash-head' },
			h(
				'div',
				{ className: 'dsp-col dsp-gap-6 dsp-dash-head-main' },
				h(
					'div',
					{ className: 'dsp-row dsp-gap-8 dsp-dash-title-row' },
					h('h1', { className: 'dsp-page-title' }, DSP.t('所有课程看板')),
					h(DSP.Tag, { tone: 'brand' }, DSP.t('全局'))
				),

			),
			h(
				'div',
				{ className: 'dsp-dash-head-actions' },
				storeState.courseId
					? h(
							DSP.Btn,
							{
								variant: 'secondary',
								icon: 'book',
								onClick: function () { DSP.store.actions.openCourse(storeState.courseId); }
							},
							DSP.t('返回课程主页')
						)
					: null,
				h(
					DSP.Btn,
					{
						variant: 'primary',
						icon: 'plus',
						onClick: function () { setCreating(true); }
					},
					DSP.t('新建课程')
				)
			)
		),
		h(
			'div',
			{ className: 'dsp-scroll' },
			h(
				'div',
				{ className: 'dsp-page-body dsp-dash-body' },
				h(
					'section',
					{ className: 'dsp-global-courses' },
					h(
						'div',
						{ className: 'dsp-section-head' },
						h(
							'div',
							{ className: 'dsp-row dsp-gap-8' },
							h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'layers', size: 16 })),
							h('h2', { className: 'dsp-section-title' }, DSP.t('课程')),
							courses.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(courses.length)) : null
						)
					),
					courses.length === 0
						? h(
								'div',
								{ className: 'dsp-card dsp-global-courses-empty' },
								h(
									DSP.Empty,
									{
										icon: 'book',
										title: DSP.t('还没有课程'),
										action: h(
											DSP.Btn,
											{ variant: 'primary', icon: 'plus', onClick: function () { setCreating(true); } },
											DSP.t('新建课程')
										)
									},
									DSP.t('新建课程后，可上传课程文档与题目文件，开始 AI 刷题。')
								)
							)
						: h(
								'div',
								{ className: 'dsp-course-grid' },
								courseRows.map(function (row) {
									const courseName = row.course.name || DSP.t('未命名课程');
									function openCourse() {
										DSP.store.actions.openCourse(row.course.id);
									}
									function openDashboard(event) {
										if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
										DSP.store.actions.openCourseDash(row.course.id);
									}
									return h(
										'div',
										{
											key: row.course.id,
											className: 'dsp-course-card',
											role: 'button',
											tabIndex: 0,
											title: courseName,
											onClick: openCourse,
											onKeyDown: function (event) {
												if (event.target !== event.currentTarget) return;
												if (event.key === 'Enter' || event.key === ' ') {
													event.preventDefault();
													openCourse();
												}
											}
										},
										h(
											'div',
											{ className: 'dsp-course-card-head' },
											h('span', { className: 'dsp-course-card-icon' }, h(DSP.Icon, { name: 'book', size: 15 })),
											h('span', { className: 'dsp-course-card-name dsp-truncate' }, courseName)
										),
										h('p', { className: 'dsp-course-card-desc' }, row.description || DSP.t('暂无课程简介')),
										h(
											'div',
											{ className: 'dsp-course-card-meta' },
											h('span', null, DSP.t('套题数') + ' ' + String(row.setCount)),
											h('span', null, DSP.t('答题数') + ' ' + String(row.answered)),
											h('span', null, DSP.t('正确率') + ' ' + (row.accuracy === null ? '—' : DSP.fmtPct(row.accuracy)))
										),
										h('div', { className: 'dsp-course-card-time' }, DSP.t('最近更新') + ' ' + DSP.fmtShortDate(row.recentAt)),
										h(
											'div',
											{ className: 'dsp-course-card-actions' },
											h(
												DSP.Btn,
												{ variant: 'secondary', icon: 'chart', className: 'dsp-btn-sm', onClick: openDashboard },
												DSP.t('看板')
											),
											h(
												DSP.Btn,
												{
													variant: 'primary',
													icon: 'chevronRight',
													className: 'dsp-btn-sm',
													onClick: function (event) {
														if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
														openCourse();
													}
												},
												DSP.t('进入课程')
											)
										)
									);
								})
							)
				),
				h(
					'div',
					{ className: 'dsp-stats' },
					h(DashStatCard, { icon: 'book', label: DSP.t('课程数'), value: String(courses.length) }),
					h(DashStatCard, { icon: 'list', label: DSP.t('累计刷题'), value: String(latestAll.length), tone: 'brand' }),
					h(DashStatCard, { icon: 'target', label: DSP.t('总正确率'), value: accuracy === null ? '—' : DSP.fmtPct(accuracy), tone: 'success' }),
					h(DashStatCard, { icon: 'clock', label: DSP.t('活跃天数'), value: String(activeDays), tone: 'warn' })
				),
				h(DSP.DashActivityHeatmap, { records: latestAll }),
				h(
					'div',
					{ className: 'dsp-dash-grid dsp-global-grid' },
					h(
						'div',
						{ className: 'dsp-card dsp-compare-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'layers', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('课程对比')),
								courses.length > 0 ? h('span', { className: 'dsp-count-badge' }, String(courses.length)) : null
							)
						),
						courses.length === 0
							? h(DSP.Empty, { icon: 'chart', title: DSP.t('还没有数据') }, DSP.t('添加课程并完成练习后，这里会显示课程对比。'))
							: h(
									'div',
									{ className: 'dsp-compare-list' },
									courseRows.map(function (row) {
										const percent = row.accuracy === null ? 0 : row.accuracy * 100;
										return h(
											'button',
											{
												key: row.course.id,
												type: 'button',
												className: 'dsp-compare-row',
												onClick: function () { DSP.store.actions.openCourseDash(row.course.id); }
											},
											h(
												'span',
												{ className: 'dsp-compare-name' },
												h('span', { className: 'dsp-compare-title dsp-truncate' }, row.course.name || DSP.t('未命名课程')),
												h(
													'span',
													{ className: 'dsp-compare-meta' },
													DSP.t('套数') + ' ' + String(row.setCount) + ' · ' + DSP.t('题数') + ' ' + String(row.questionTotal) + ' · ' + DSP.t('已答') + ' ' + String(row.answered)
												)
											),
											h(
												'span',
												{ className: 'dsp-compare-track' },
												h('span', {
													className: 'dsp-compare-fill' + (row.accuracy !== null && row.accuracy < 0.5 ? ' dsp-compare-fill-bad' : ''),
													style: { width: Math.max(0, Math.min(100, percent)) + '%' }
												})
											),
											h('span', { className: 'dsp-compare-value' }, row.accuracy === null ? '—' : DSP.fmtPct(row.accuracy))
										);
									})
								)
					),
					h(
						'div',
						{ className: 'dsp-card dsp-activity-card' },
						h(
							'div',
							{ className: 'dsp-section-head' },
							h(
								'div',
								{ className: 'dsp-row dsp-gap-8' },
								h('span', { className: 'dsp-section-icon' }, h(DSP.Icon, { name: 'clock', size: 16 })),
								h('h2', { className: 'dsp-section-title' }, DSP.t('最近活动'))
							)
						),
						activities.length === 0
							? h(DSP.Empty, { icon: 'clock', title: DSP.t('还没有数据') }, DSP.t('完成练习后，这里会显示所有课程的最近作答。'))
							: h(
									'div',
									{ className: 'dsp-activity-list' },
									activities.map(function (activity, index) {
										const tone = activity.correct === true ? 'success' : activity.correct === false ? 'error' : 'neutral';
										const label = activity.correct === true ? DSP.t('正确') : activity.correct === false ? DSP.t('错误') : DSP.t('已答');
										return h(
											'div',
											{ key: String(activity.id || index) + '-' + index, className: 'dsp-activity-row' },
											h('span', { className: 'dsp-activity-dot dsp-activity-dot-' + tone }),
											h(
												'span',
												{ className: 'dsp-activity-main' },
												h('span', { className: 'dsp-activity-course dsp-truncate' }, activity.courseName || DSP.t('未命名课程')),
												h('span', { className: 'dsp-activity-sep' }, '·'),
												h('span', { className: 'dsp-activity-set dsp-truncate' }, activity.setTitle || DSP.t('未命名套题'))
											),
											h(DSP.Tag, { tone: tone }, label),
											h('span', { className: 'dsp-activity-time' }, DSP.fmtShortDate(activity.at))
										);
									})
								)
					)
				),
				h(DashAnalysisCard, {
					title: DSP.t('全局学情分析与建议'),
					markdown: globalAnalysis && globalAnalysis.markdown ? globalAnalysis.markdown : '',
					generatedAt: globalAnalysis && globalAnalysis.generatedAt ? globalAnalysis.generatedAt : null,
					job: analysisJob,
					disabled: courses.length === 0,
					onGenerate: openGlobalAnalysis,
					emptyTitle: DSP.t('还没有全局学情分析'),
					emptyText: DSP.t('汇总所有课程的作答记录，生成跨课程的学情分析与复习建议。')
				})
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

DSP.GlobalDashboard = GlobalDashboardView;

/* ==== src/client/70-selection.js ==== */
/* 刷题模式 Client — 框选提问浮层（chat-ui-dev）。
 * 监听 document 选区：在刷题区（.dsp-main / .dsp-practice-area）内选中文字时，
 * 于选区上方渲染固定定位的「提问」按钮；点击后附加到右侧对话。
 * 浮层由 React 渲染在 App 组件树内（不写 document.body），只用 fixed 定位。
 */

var selRecompute = null;
var selMaxTextLength = 2000;

/* 把选区里的节点安全地转成 Element。 */
function selNodeElement(node) {
	if (!node) return null;
	if (node.nodeType === 1) return node;
	return node.parentElement || null;
}

function selIsEditableElement(element) {
	if (!element || typeof element.closest !== 'function') return false;
	return Boolean(element.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'));
}

/* 读取当前选区；不在刷题区或不该触发时返回 null。 */
function selReadSelection() {
	var selection = window.getSelection ? window.getSelection() : null;
	if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
	var rawText = String(selection.toString() || '').trim();
	if (!rawText) return null;
	var range = selection.getRangeAt(0);
	var element = selNodeElement(range.commonAncestorContainer);
	if (!element || typeof element.closest !== 'function') return null;
	/* 仅刷题工作区内触发（右侧对话 / 左侧课程栏 / 浮层自身的文字不触发）。 */
	if (!element.closest('.dsp-main') && !element.closest('.dsp-practice-area')) return null;
	if (element.closest('.dsp-chat') || element.closest('.dsp-rail') || element.closest('.dsp-selection-action')) return null;
	if (selIsEditableElement(element)) return null;
	var rect = range.getBoundingClientRect();
	if (!rect || (rect.width === 0 && rect.height === 0)) return null;
	var text = rawText.length > selMaxTextLength ? rawText.slice(0, selMaxTextLength) : rawText;
	var left = rect.left + rect.width / 2;
	var top = Math.max(40, rect.top - 8);
	if (typeof window.innerWidth === 'number' && window.innerWidth > 140) {
		left = Math.max(70, Math.min(window.innerWidth - 70, left));
	}
	return { text: text, truncated: rawText.length > selMaxTextLength, top: top, left: left };
}

function selClearNativeSelection() {
	try {
		var selection = window.getSelection ? window.getSelection() : null;
		if (selection && typeof selection.removeAllRanges === 'function') selection.removeAllRanges();
	} catch (error) {
		/* 清除选区失败不影响功能 */
	}
}

/* PracticeArea 的 onMouseUp 会调用（也允许外部手动触发重算）。 */
DSP.handlePracticeSelection = function handlePracticeSelection() {
	window.setTimeout(function () {
		if (typeof selRecompute === 'function') selRecompute();
	}, 0);
};

/* 兼容契约导出：附加文字到右侧对话。 */
DSP.attachToChat = function attachToChat(payload) {
	if (!payload) return;
	if (DSP.store && DSP.store.actions && typeof DSP.store.actions.attachToChat === 'function') {
		DSP.store.actions.attachToChat(payload);
	}
};

DSP.SelectionAction = function SelectionAction() {
	var statePair = React.useState(null);
	var overlay = statePair[0];
	var setOverlay = statePair[1];
	var overlayRef = React.useRef(null);
	var suppressRef = React.useRef(0);

	React.useEffect(function () {
		var timer = 0;
		var pressed = false;
		var downPoint = null;

		function apply(next) {
			var normalized = next || null;
			overlayRef.current = normalized;
			setOverlay(normalized);
		}

		function recompute() {
			/* 点击「提问」后短暂抑制重算，避免清空选区失败时按钮又闪回来。 */
			if (Date.now() < suppressRef.current) return;
			apply(selReadSelection());
		}

		selRecompute = recompute;

		function schedule(delay) {
			if (timer) window.clearTimeout(timer);
			timer = window.setTimeout(function () {
				timer = 0;
				recompute();
			}, delay);
		}

		function isActionTarget(node) {
			var element = selNodeElement(node);
			return Boolean(element && typeof element.closest === 'function' && element.closest('.dsp-selection-action'));
		}

		function onMouseDown(event) {
			pressed = true;
			downPoint = { x: event.clientX || 0, y: event.clientY || 0 };
			if (isActionTarget(event.target)) return;
			if (overlayRef.current) apply(null);
		}

		function onMouseUp(event) {
			pressed = false;
			var wasClick = false;
			if (downPoint) {
				wasClick = Math.abs((event.clientX || 0) - downPoint.x) < 4 && Math.abs((event.clientY || 0) - downPoint.y) < 4;
				downPoint = null;
			}
			if (isActionTarget(event.target)) return;
			/* 单纯点击别处（而非拖选）只隐藏，不重新弹出。 */
			if (wasClick) {
				if (overlayRef.current) apply(null);
				return;
			}
			schedule(0);
		}

		function onSelectionChange() {
			if (pressed) return;
			var selection = window.getSelection ? window.getSelection() : null;
			if (!selection || selection.isCollapsed) {
				if (overlayRef.current) apply(null);
				return;
			}
			schedule(90);
		}

		function onScroll() {
			if (overlayRef.current) apply(null);
		}

		function onResize() {
			if (overlayRef.current) apply(null);
		}

		function onKeyDown(event) {
			if (event && event.key === 'Escape' && overlayRef.current) apply(null);
		}

		document.addEventListener('mousedown', onMouseDown, true);
		document.addEventListener('mouseup', onMouseUp, true);
		document.addEventListener('selectionchange', onSelectionChange);
		document.addEventListener('scroll', onScroll, true);
		document.addEventListener('keydown', onKeyDown, true);
		window.addEventListener('resize', onResize);
		return function cleanup() {
			if (timer) window.clearTimeout(timer);
			if (selRecompute === recompute) selRecompute = null;
			document.removeEventListener('mousedown', onMouseDown, true);
			document.removeEventListener('mouseup', onMouseUp, true);
			document.removeEventListener('selectionchange', onSelectionChange);
			document.removeEventListener('scroll', onScroll, true);
			document.removeEventListener('keydown', onKeyDown, true);
			window.removeEventListener('resize', onResize);
		};
	}, []);

	if (!overlay) return null;

	return h(
		'div',
		{
			className: 'dsp-selection-action',
			style: { top: overlay.top + 'px', left: overlay.left + 'px' },
			role: 'presentation',
			onMouseDown: function (event) {
				event.preventDefault();
			}
		},
		h(
			'button',
			{
				type: 'button',
				className: 'dsp-selection-action-btn',
				title: DSP.t('附加到对话'),
				onClick: function (event) {
					event.preventDefault();
					event.stopPropagation();
					var current = overlayRef.current;
					if (!current || !current.text) return;
					if (DSP.store && DSP.store.actions && typeof DSP.store.actions.attachToChat === 'function') {
						DSP.store.actions.attachToChat({ text: current.text, label: DSP.t('选中文字') });
					}
					suppressRef.current = Date.now() + 300;
					selClearNativeSelection();
					overlayRef.current = null;
					setOverlay(null);
				}
			},
			h(DSP.Icon, { name: 'chat', size: 13 }),
			h('span', null, DSP.t('提问'))
		)
	);
};

/* ==== src/client/75-composer-attach.js ==== */
/* 刷题模式 Client — 聊天输入区辅助（chat-ui-dev）。
 * 上下文 chips 的渲染放在这里，由 50-chat.js 的上下文条在运行时调用
 * （DSP.renderChatChip），避免 50 与 75 的顶层求值顺序问题。
 */

var chatAttachPreviewLength = 140;

function chatAttachmentTitle(attachment) {
	if (!attachment) return '';
	if (attachment.type === 'question') {
		/* store 的 askQuestion 已经生成「第 N 题」label，优先沿用保证展示一致。 */
		if (attachment.label) return DSP.t(attachment.label);
		var number = attachment.number === undefined || attachment.number === null ? '' : String(attachment.number);
		if (number) return DSP.t('第') + ' ' + number + ' ' + DSP.t('题');
		return DSP.t('题目');
	}
	return DSP.t(attachment.label || '选中文字');
}

function chatAttachmentPreview(attachment) {
	if (!attachment || attachment.type === 'question') return '';
	var source = attachment.text ? String(attachment.text) : '';
	if (!source) return '';
	var compact = source.replace(/\s+/g, ' ').trim();
	if (!compact) return '';
	return compact.length > chatAttachPreviewLength ? compact.slice(0, chatAttachPreviewLength) + '…' : compact;
}

DSP.chatAttachmentTitle = chatAttachmentTitle;
DSP.chatAttachmentPreview = chatAttachmentPreview;

/* 渲染一个上下文 chip：attachment + 可选移除回调。 */
DSP.renderChatChip = function renderChatChip(attachment, onRemove) {
	if (!attachment) return null;
	var isQuestion = attachment.type === 'question';
	var title = chatAttachmentTitle(attachment);
	var preview = chatAttachmentPreview(attachment);
	var children = [
		h(DSP.Icon, { key: 'icon', name: isQuestion ? 'list' : 'chat', size: 13 }),
		h('span', { key: 'label', className: 'dsp-chat-chip-label' }, title)
	];
	if (preview) children.push(h('span', { key: 'preview', className: 'dsp-chat-chip-text', title: preview }, preview));
	if (typeof onRemove === 'function' && attachment.id) {
		children.push(
			h(DSP.IconBtn, {
				key: 'remove',
				icon: 'x',
				size: 12,
				label: DSP.t('删除'),
				className: 'dsp-chat-chip-remove',
				onClick: function (event) {
					if (event) {
						event.preventDefault();
						event.stopPropagation();
					}
					onRemove(attachment.id);
				}
			})
		);
	}
	return h(
		'div',
		{
			key: attachment.id || ('chat-chip-' + attachment.type),
			className: 'dsp-chat-chip ' + (isQuestion ? 'dsp-chat-chip-question' : 'dsp-chat-chip-selection')
		},
		children
	);
};

/* ==== src/client/90-app.js ==== */
/* 刷题模式 Client — 三栏应用壳（Lead 维护）。
 * 负责：初始化 bootstrap、主题 CSS 注入、左侧 Rail / 中间视图 / 右侧 Chat 的三栏布局、
 * 全局 Toast 与框选提问浮层。
 */

function AppLoading(props) {
	return h(
		'div',
		{ className: 'dsp-boot' },
		h('div', { className: 'dsp-boot-card' },
			h('div', { className: 'dsp-boot-logo' }, h(DSP.Icon, { name: 'logo', size: 34 })),
			h('div', { className: 'dsp-boot-title' }, DSP.t('刷题模式')),
			props.error
				? h('div', { className: 'dsp-col dsp-gap-10', style: { alignItems: 'center' } },
					h('div', { className: 'dsp-field-error', style: { maxWidth: '420px', textAlign: 'center' } }, props.error),
					h(DSP.Btn, { variant: 'primary', onClick: props.onRetry, icon: 'refresh' }, DSP.t('重试')))
				: h('div', { className: 'dsp-row dsp-gap-8 dsp-muted' },
					h(DSP.Spinner, { size: 16 }),
					h('span', null, DSP.t('正在加载学习数据…')))
		)
	);
}

function Welcome() {
	const createState = React.useState(false);
	const creating = createState[0];
	const setCreating = createState[1];
	return h(
		'div',
		{ className: 'dsp-welcome' },
		h('div', { className: 'dsp-welcome-hero' },
			h('div', { className: 'dsp-welcome-logo' }, h(DSP.Icon, { name: 'logo', size: 40 })),
			h('h1', { className: 'dsp-welcome-title' }, DSP.t('刷题模式')),
			h('p', { className: 'dsp-welcome-sub' }, '上传课程文档与题目文件，AI 自动解析题目、逐题练习、生成学情看板与复习方案。'),
			h('div', { className: 'dsp-welcome-actions' },
				h(DSP.Btn, { variant: 'primary', size: 'lg', icon: 'plus', onClick: function () { setCreating(true); } }, DSP.t('新建课程')),
				h(DSP.Btn, { variant: 'secondary', size: 'lg', icon: 'chart', onClick: function () { DSP.store.actions.openGlobalDash(); } }, DSP.t('所有课程看板'))
			),
			h('div', { className: 'dsp-welcome-grid' },
				[
					{ icon: 'book', title: '课程与文档', text: '按课程组织资料：上传 PDF / Word / PPT / 文本或整个文件夹。' },
					{ icon: 'list', title: '自动解析题目', text: '扫描题目文件为结构化题目，支持共用材料、选择题、判断题、填空题与简答题。' },
					{ icon: 'chat', title: '答题页答疑', text: '答题时随时提问，答疑只看当前题目与我的回答。' },
					{ icon: 'target', title: '学情与复习', text: '记录每次作答，课程级与全局看板给出易错点与复习计划。' }
				].map(function (item) {
					return h('div', { key: item.title, className: 'dsp-welcome-cell' },
						h('div', { className: 'dsp-welcome-cell-icon' }, h(DSP.Icon, { name: item.icon, size: 20 })),
						h('div', { className: 'dsp-welcome-cell-title' }, item.title),
						h('div', { className: 'dsp-welcome-cell-text' }, item.text));
				})
			)
		),
		creating ? h(DSP.CourseCreateModal, { onClose: function () { setCreating(false); } }) : null
	);
}

function ToastHost() {
	const toasts = DSP.useStore(function (state) {
		return state.ui.toasts || [];
	});
	if (toasts.length === 0) return null;
	return h(
		'div',
		{ className: 'dsp-toasts', role: 'status', 'aria-live': 'polite' },
		toasts.map(function (toast) {
			const icon = toast.kind === 'error' ? 'closeCircle' : toast.kind === 'success' ? 'checkCircle' : toast.kind === 'warn' ? 'alert' : 'bulb';
			return h(
				'div',
				{ key: toast.id, className: 'dsp-toast dsp-toast-' + (toast.kind || 'info') },
				h(DSP.Icon, { name: icon, size: 15 }),
				h('span', null, toast.text),
				h(DSP.IconBtn, {
					icon: 'x',
					size: 13,
					label: '关闭',
					onClick: function () {
						DSP.store.actions.dismissToast(toast.id);
					}
				})
			);
		})
	);
}

function ViewRouter() {
	const state = DSP.useStore(function (value) {
		return { view: value.ui.view, ui: value.ui, courses: value.data.courses };
	});
	const ui = state.ui;
	const hasCourse = Boolean(ui.courseId);
	if (state.view === 'global-dash') {
		return DSP.GlobalDashboard ? h(DSP.GlobalDashboard) : h(Welcome);
	}
	if (!hasCourse) {
		// 左栏已移除：无课程时直接进入中间的「所有课程看板」（课程与看板的统一入口）。
		return DSP.GlobalDashboard ? h(DSP.GlobalDashboard) : h(Welcome);
	}
	if (state.view === 'course-dash') {
		return DSP.CourseDashboard ? h(DSP.CourseDashboard) : h(Welcome);
	}
	if (state.view === 'practice') {
		if (!ui.setId) return DSP.CourseHome ? h(DSP.CourseHome) : h(Welcome);
		return DSP.PracticeArea ? h(DSP.PracticeArea) : h(Welcome);
	}
	return DSP.CourseHome ? h(DSP.CourseHome) : h(Welcome);
}

function App() {
	const state = DSP.useStore(function (value) {
		return { ready: value.ready, loading: value.loading, error: value.error, view: value.ui.view, setId: value.ui.setId };
	});
	const localeBumpState = React.useState(0);
	const bumpLocale = localeBumpState[1];

	React.useEffect(function () {
		DSP.store.actions.init();
	}, []);

	React.useEffect(function () {
		return DSP.subscribeLocale(function () {
			bumpLocale(function (value) {
				return value + 1;
			});
		});
	}, []);

	React.useEffect(function () {
		document.documentElement.classList.add('dsp-mode');
		return function () {
			document.documentElement.classList.remove('dsp-mode');
		};
	}, []);

	const styleElement = h('style', { 'data-practice-mode': 'true' }, __DSP_CSS__);

	if (!state.ready) {
		return h(
			'div',
			{ className: 'dsp-app dsp-app-boot' },
			styleElement,
			h(AppLoading, {
				error: state.error,
				onRetry: function () {
					DSP.store.actions.reload().catch(function () {});
				}
			})
		);
	}

	return h(
		'div',
		{ className: 'dsp-app' },
		styleElement,
		h(
			'main',
			{ className: 'dsp-main', role: 'region', 'aria-label': DSP.t('刷题模式') },
			h(ViewRouter)
		),
		/* 答疑助手只在答题界面出现；课程主页/看板不显示。 */
		state.view === 'practice' && state.setId && DSP.ChatPanel ? h(DSP.ChatPanel) : null,
		state.view === 'practice' && state.setId && DSP.SelectionAction ? h(DSP.SelectionAction) : null,
		h(ToastHost)
	);
}

/* ==== src/client/99-footer.js ==== */
/* 刷题模式 Client — 插件注册（Lead 维护）。
 * 把「刷题模式」入口注册到左侧插件栏 sidebar.panellist，并把工作台注册到
 * layout 的 main keyed slot（key=practice-mode）。sidebar 点击会调用
 * ctx.layout.selectPanel(id)，因此两个注册的 id/key 必须一致。
 */

function PracticePanelIcon(props) {
	// 直接返回 svg（.dsp-icon 为 display:block），避免内联元素基线对齐导致
	// 插件栏未选中时图标视觉上偏上。
	return h(DSP.Icon, { name: 'logo', size: (props && props.size) || 18, title: DSP.t('刷题模式') });
}

function applyPracticeMode(ctx) {
	DSP.initLocale(ctx);

	function logError(label, error) {
		try {
			console.error('[practice-mode] ' + label, error);
		} catch (ignored) {
			/* ignore */
		}
	}

	try {
		const disposePanelIcon = ctx.slots.inject('sidebar.panellist', function () {
			return ctx.slots.register(
				{
					name: 'sidebar.panellist',
					id: 'practice-mode',
					order: 18,
					label: function () {
						return DSP.t('刷题模式');
					}
				},
				PracticePanelIcon
			);
		});
		if (typeof ctx.effect === 'function') ctx.effect(function () { return disposePanelIcon; }, 'practice-mode: sidebar entry');
	} catch (error) {
		logError('sidebar.panellist registration failed', error);
	}

	try {
		const disposeMain = ctx.slots.inject('main', function () {
			return ctx.slots.register(
				{
					name: 'main',
					key: 'practice-mode'
				},
				App
			);
		});
		if (typeof ctx.effect === 'function') ctx.effect(function () { return disposeMain; }, 'practice-mode: main panel');
	} catch (error) {
		logError('main panel registration failed', error);
	}
}

		return { inject: ['slots', 'layout', 'locale'], apply: applyPracticeMode };
	},
});
