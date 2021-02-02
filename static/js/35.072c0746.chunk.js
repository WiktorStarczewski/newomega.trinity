(this["webpackJsonpmy-react-app"]=this["webpackJsonpmy-react-app"]||[]).push([[35],{652:function(t,e,n){"use strict";n.r(e),n.d(e,"ion_select",(function(){return l})),n.d(e,"ion_select_option",(function(){return g})),n.d(e,"ion_select_popover",(function(){return m}));var i=n(54),o=n(343),r=(n(96),n(181)),s=n(204),a=n(681),c=n(687),l=function(){function t(t){var e=this;Object(o.l)(this,t),this.inputId="ion-sel-"+v++,this.didInit=!1,this.isExpanded=!1,this.disabled=!1,this.cancelText="Cancel",this.okText="OK",this.name=this.inputId,this.multiple=!1,this.interface="alert",this.interfaceOptions={},this.onClick=function(t){e.setFocus(),e.open(t)},this.onFocus=function(){e.ionFocus.emit()},this.onBlur=function(){e.ionBlur.emit()},this.ionChange=Object(o.e)(this,"ionChange",7),this.ionCancel=Object(o.e)(this,"ionCancel",7),this.ionFocus=Object(o.e)(this,"ionFocus",7),this.ionBlur=Object(o.e)(this,"ionBlur",7),this.ionStyle=Object(o.e)(this,"ionStyle",7)}return t.prototype.disabledChanged=function(){this.emitStyle()},t.prototype.valueChanged=function(){this.updateOptions(),this.emitStyle(),this.didInit&&this.ionChange.emit({value:this.value})},t.prototype.connectedCallback=function(){return Object(i.a)(this,void 0,void 0,(function(){var t,e=this;return Object(i.c)(this,(function(n){return void 0===this.value&&(this.multiple?(t=this.childOpts.filter((function(t){return t.selected})),this.value=t.map((function(t){return u(t)}))):(t=this.childOpts.find((function(t){return t.selected})))&&(this.value=u(t))),this.updateOptions(),this.updateOverlayOptions(),this.emitStyle(),this.mutationO=Object(c.b)(this.el,"ion-select-option",(function(){return Object(i.a)(e,void 0,void 0,(function(){return Object(i.c)(this,(function(t){return this.updateOptions(),this.updateOverlayOptions(),[2]}))}))})),[2]}))}))},t.prototype.disconnectedCallback=function(){this.mutationO&&(this.mutationO.disconnect(),this.mutationO=void 0)},t.prototype.componentDidLoad=function(){this.didInit=!0},t.prototype.open=function(t){return Object(i.a)(this,void 0,void 0,(function(){var e,n,o=this;return Object(i.c)(this,(function(i){switch(i.label){case 0:return this.disabled||this.isExpanded?[2,void 0]:(n=this,[4,this.createOverlay(t)]);case 1:return e=n.overlay=i.sent(),this.isExpanded=!0,e.onDidDismiss().then((function(){o.overlay=void 0,o.isExpanded=!1,o.setFocus()})),[4,e.present()];case 2:return i.sent(),[2,e]}}))}))},t.prototype.createOverlay=function(t){var e=this.interface;return"action-sheet"!==e&&"popover"!==e||!this.multiple||(console.warn('Select interface cannot be "'+e+'" with a multi-value select. Using the "alert" interface instead.'),e="alert"),"popover"!==e||t||(console.warn('Select interface cannot be a "popover" without passing an event. Using the "alert" interface instead.'),e="alert"),"popover"===e?this.openPopover(t):"action-sheet"===e?this.openActionSheet():this.openAlert()},t.prototype.updateOverlayOptions=function(){var t=this.overlay;if(t){var e=this.childOpts;switch(this.interface){case"action-sheet":t.buttons=this.createActionSheetButtons(e);break;case"popover":var n=t.querySelector("ion-select-popover");n&&(n.options=this.createPopoverOptions(e));break;case"alert":var i=this.multiple?"checkbox":"radio";t.inputs=this.createAlertInputs(e,i)}}},t.prototype.createActionSheetButtons=function(t){var e=this,n=t.map((function(t){return{role:t.selected?"selected":"",text:t.textContent,handler:function(){e.value=u(t)}}}));return n.push({text:this.cancelText,role:"cancel",handler:function(){e.ionCancel.emit()}}),n},t.prototype.createAlertInputs=function(t,e){return t.map((function(t){return{type:e,label:t.textContent,value:u(t),checked:t.selected,disabled:t.disabled}}))},t.prototype.createPopoverOptions=function(t){var e=this;return t.map((function(t){var n=u(t);return{text:t.textContent,value:n,checked:t.selected,disabled:t.disabled,handler:function(){e.value=n,e.close()}}}))},t.prototype.openPopover=function(t){return Object(i.a)(this,void 0,void 0,(function(){var e,n,r;return Object(i.c)(this,(function(i){return e=this.interfaceOptions,n=Object(o.d)(this),r=Object.assign(Object.assign({mode:n},e),{component:"ion-select-popover",cssClass:["select-popover",e.cssClass],event:t,componentProps:{header:e.header,subHeader:e.subHeader,message:e.message,value:this.value,options:this.createPopoverOptions(this.childOpts)}}),[2,s.d.create(r)]}))}))},t.prototype.openActionSheet=function(){return Object(i.a)(this,void 0,void 0,(function(){var t,e,n;return Object(i.c)(this,(function(i){return t=Object(o.d)(this),e=this.interfaceOptions,n=Object.assign(Object.assign({mode:t},e),{buttons:this.createActionSheetButtons(this.childOpts),cssClass:["select-action-sheet",e.cssClass]}),[2,s.c.create(n)]}))}))},t.prototype.openAlert=function(){return Object(i.a)(this,void 0,void 0,(function(){var t,e,n,r,a,c,l=this;return Object(i.c)(this,(function(i){return t=this.getLabel(),e=t?t.textContent:null,n=this.interfaceOptions,r=this.multiple?"checkbox":"radio",a=Object(o.d)(this),c=Object.assign(Object.assign({mode:a},n),{header:n.header?n.header:e,inputs:this.createAlertInputs(this.childOpts,r),buttons:[{text:this.cancelText,role:"cancel",handler:function(){l.ionCancel.emit()}},{text:this.okText,handler:function(t){l.value=t}}],cssClass:["select-alert",n.cssClass,this.multiple?"multiple-select-alert":"single-select-alert"]}),[2,s.b.create(c)]}))}))},t.prototype.close=function(){return this.overlay?this.overlay.dismiss():Promise.resolve(!1)},t.prototype.updateOptions=function(){for(var t=!0,e=this.value,n=this.childOpts,i=this.compareWith,o=this.multiple,r=0,s=n;r<s.length;r++){var a=s[r],c=u(a),l=t&&p(e,c,i);a.selected=l,l&&!o&&(t=!1)}},t.prototype.getLabel=function(){return Object(r.f)(this.el)},t.prototype.hasValue=function(){return""!==this.getText()},Object.defineProperty(t.prototype,"childOpts",{get:function(){return Array.from(this.el.querySelectorAll("ion-select-option"))},enumerable:!0,configurable:!0}),t.prototype.getText=function(){var t=this.selectedText;return null!=t&&""!==t?t:f(this.childOpts,this.value,this.compareWith)},t.prototype.setFocus=function(){this.buttonEl&&this.buttonEl.focus()},t.prototype.emitStyle=function(){this.ionStyle.emit({interactive:!0,select:!0,"has-placeholder":null!=this.placeholder,"has-value":this.hasValue(),"interactive-disabled":this.disabled,"select-disabled":this.disabled})},t.prototype.render=function(){var t,e=this,n=this,i=n.placeholder,s=n.name,c=n.disabled,l=n.isExpanded,u=n.value,p=n.el,h=Object(o.d)(this),f=this.inputId+"-lbl",b=Object(r.f)(p);b&&(b.id=f);var v=!1,g=this.getText();""===g&&null!=i&&(g=i,v=!0),Object(r.a)(!0,p,s,d(u),c);var O={"select-text":!0,"select-placeholder":v};return Object(o.i)(o.a,{onClick:this.onClick,role:"combobox","aria-haspopup":"dialog","aria-disabled":c?"true":null,"aria-expanded":""+l,"aria-labelledby":f,class:(t={},t[h]=!0,t["in-item"]=Object(a.c)("ion-item",p),t["select-disabled"]=c,t)},Object(o.i)("div",{class:O},g),Object(o.i)("div",{class:"select-icon",role:"presentation"},Object(o.i)("div",{class:"select-icon-inner"})),Object(o.i)("button",{type:"button",onFocus:this.onFocus,onBlur:this.onBlur,disabled:c,ref:function(t){return e.buttonEl=t}}))},Object.defineProperty(t.prototype,"el",{get:function(){return Object(o.f)(this)},enumerable:!0,configurable:!0}),Object.defineProperty(t,"watchers",{get:function(){return{disabled:["disabledChanged"],placeholder:["disabledChanged"],value:["valueChanged"]}},enumerable:!0,configurable:!0}),Object.defineProperty(t,"style",{get:function(){return":host{padding-left:var(--padding-start);padding-right:var(--padding-end);padding-top:var(--padding-top);padding-bottom:var(--padding-bottom);display:-ms-flexbox;display:flex;position:relative;font-family:var(--ion-font-family,inherit);overflow:hidden;z-index:2}@supports ((-webkit-margin-start:0) or (margin-inline-start:0)) or (-webkit-margin-start:0){:host{padding-left:unset;padding-right:unset;-webkit-padding-start:var(--padding-start);padding-inline-start:var(--padding-start);-webkit-padding-end:var(--padding-end);padding-inline-end:var(--padding-end)}}:host(.in-item){position:static;max-width:45%}:host(.select-disabled){opacity:.4;pointer-events:none}:host(.ion-focused) button{border:2px solid #5e9ed6}.select-placeholder{color:currentColor;opacity:.33}button{left:0;top:0;margin-left:0;margin-right:0;margin-top:0;margin-bottom:0;position:absolute;width:100%;height:100%;border:0;background:transparent;cursor:pointer;-webkit-appearance:none;-moz-appearance:none;appearance:none;outline:none}:host-context([dir=rtl]) button,[dir=rtl] button{left:unset;right:unset;right:0}button::-moz-focus-inner{border:0}.select-icon{position:relative}.select-text{-ms-flex:1;flex:1;min-width:16px;font-size:inherit;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.select-icon-inner{left:5px;top:50%;margin-top:-3px;position:absolute;width:0;height:0;border-top:5px solid;border-right:5px solid transparent;border-left:5px solid transparent;color:currentColor;opacity:.33;pointer-events:none}:host-context([dir=rtl]) .select-icon-inner,[dir=rtl] .select-icon-inner{left:unset;right:unset;right:5px}:host{--padding-top:10px;--padding-end:0;--padding-bottom:11px;--padding-start:16px}.select-icon{width:19px;height:19px}"},enumerable:!0,configurable:!0}),t}(),u=function(t){var e=t.value;return void 0===e?t.textContent||"":e},d=function(t){if(null!=t)return Array.isArray(t)?t.join(","):t.toString()},p=function(t,e,n){return void 0!==t&&(Array.isArray(t)?t.some((function(t){return h(t,e,n)})):h(t,e,n))},h=function(t,e,n){return"function"===typeof n?n(t,e):"string"===typeof n?t[n]===e[n]:t===e},f=function(t,e,n){return void 0===e?"":Array.isArray(e)?e.map((function(e){return b(t,e,n)})).filter((function(t){return null!==t})).join(", "):b(t,e,n)||""},b=function(t,e,n){var i=t.find((function(t){return h(u(t),e,n)}));return i?i.textContent:null},v=0,g=function(){function t(t){Object(o.l)(this,t),this.inputId="ion-selopt-"+O++,this.disabled=!1,this.selected=!1}return t.prototype.render=function(){return Object(o.i)(o.a,{role:"option",id:this.inputId,class:Object(o.d)(this)})},Object.defineProperty(t.prototype,"el",{get:function(){return Object(o.f)(this)},enumerable:!0,configurable:!0}),Object.defineProperty(t,"style",{get:function(){return":host{display:none}"},enumerable:!0,configurable:!0}),t}(),O=0,m=function(){function t(t){Object(o.l)(this,t),this.options=[]}return t.prototype.onSelect=function(t){var e=this.options.find((function(e){return e.value===t.target.value}));e&&Object(s.p)(e.handler)},t.prototype.render=function(){return Object(o.i)(o.a,{class:Object(o.d)(this)},Object(o.i)("ion-list",null,void 0!==this.header&&Object(o.i)("ion-list-header",null,this.header),(void 0!==this.subHeader||void 0!==this.message)&&Object(o.i)("ion-item",null,Object(o.i)("ion-label",{class:"ion-text-wrap"},void 0!==this.subHeader&&Object(o.i)("h3",null,this.subHeader),void 0!==this.message&&Object(o.i)("p",null,this.message))),Object(o.i)("ion-radio-group",null,this.options.map((function(t){return Object(o.i)("ion-item",null,Object(o.i)("ion-label",null,t.text),Object(o.i)("ion-radio",{checked:t.checked,value:t.value,disabled:t.disabled}))})))))},Object.defineProperty(t,"style",{get:function(){return".sc-ion-select-popover-h ion-list.sc-ion-select-popover{margin-left:0;margin-right:0;margin-top:-1px;margin-bottom:-1px}.sc-ion-select-popover-h ion-label.sc-ion-select-popover, .sc-ion-select-popover-h ion-list-header.sc-ion-select-popover{margin-left:0;margin-right:0;margin-top:0;margin-bottom:0}"},enumerable:!0,configurable:!0}),t}()},681:function(t,e,n){"use strict";n.d(e,"a",(function(){return r})),n.d(e,"b",(function(){return s})),n.d(e,"c",(function(){return o})),n.d(e,"d",(function(){return c}));var i=n(54),o=function(t,e){return null!==e.closest(t)},r=function(t){var e;return"string"===typeof t&&t.length>0?((e={"ion-color":!0})["ion-color-"+t]=!0,e):void 0},s=function(t){var e={};return function(t){return void 0!==t?(Array.isArray(t)?t:t.split(" ")).filter((function(t){return null!=t})).map((function(t){return t.trim()})).filter((function(t){return""!==t})):[]}(t).forEach((function(t){return e[t]=!0})),e},a=/^[a-z][a-z0-9+\-.]*:/,c=function(t,e,n){return Object(i.a)(void 0,void 0,void 0,(function(){var o;return Object(i.c)(this,(function(i){return null!=t&&"#"!==t[0]&&!a.test(t)&&(o=document.querySelector("ion-router"))?(null!=e&&e.preventDefault(),[2,o.push(t,n)]):[2,!1]}))}))}},687:function(t,e,n){"use strict";n.d(e,"a",(function(){return r})),n.d(e,"b",(function(){return i}));var i=function(t,e,n){var i=new MutationObserver((function(t){n(o(t,e))}));return i.observe(t,{childList:!0,subtree:!0}),i},o=function(t,e){var n;return t.forEach((function(t){for(var i=0;i<t.addedNodes.length;i++)n=r(t.addedNodes[i],e)||n})),n},r=function(t,e){if(1===t.nodeType)return(t.tagName===e.toUpperCase()?[t]:Array.from(t.querySelectorAll(e))).find((function(t){return!0===t.checked}))}}}]);
//# sourceMappingURL=35.072c0746.chunk.js.map