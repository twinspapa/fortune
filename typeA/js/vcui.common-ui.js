var detailPopFlag = false;

/*!
 * @module vcui.ui.Accordion
 * @license MIT License
 * @description 아코디온 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/accordion', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    var ui = core.ui,
        name = 'accordion',
        eventBeforeCollapse = name + 'beforecollapse',
        eventCollapse = name + 'collapse',
        eventBeforeExpand = name + 'beforeexpand',
        eventExpand = name + 'expand';

    /**
     * @class
     * @description 아코디언 컴포넌트
     * @name vcui.ui.Accordion
     * @extends vcui.ui.View
     */
    var Accordion = ui('Accordion', /**@lends vcui.ui.Accordion# */{
        $statics: {
            ON_BEFORE_COLLAPSE: eventBeforeCollapse,
            ON_COLLAPSE: eventCollapse,
            ON_BEFORE_EXPAND: eventBeforeExpand,
            ON_EXPAND: eventExpand
        },
        bindjQuery: name,
        defaults: {
            singleOpen: false,
            duration: 200,
            activeClass: "active",
            selectedClass: 'on',
            itemClosest: 'li',
            itemSelector: '>ul>li',
            toggleSelector: ">.head>.ui_accord_toggle",
            contentSelector: ">.ui_accord_content"
        },

        /**
         * 생성자
         * @param el 모듈 요소
         * @param {object} [options] 옵션(기본값: defaults 속성 참조)
         * @param {boolean} [options.singleOpen = false] 단일열림 / 다중열림 여부
         * @param {number} [options.duration = 200] 펼쳐지거나 닫혀지거나 할 때 애니메이션 속도
         * @param {string} [options.activeClass = 'active'] 활성화됐을 때 추가할 css 클래스명
         * @param {string} [options.selectedClass = 'on'] 버튼이 토글될 때 추가할 css 클래스명
         * @param {string} [options.itemClosest = 'li']
         * @param {string} [options.itemSelector = '>ul>li']
         * @param {string} [options.toggleSelector = '>.head>.ui_accord_toggle'] 토글버튼
         * @param {string} [options.contentSelector = '>.ui_accord_content'] 컨텐츠
         */
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._bindEvent();
            var openIndex = self.options.openIndex;
            if (openIndex !== undefined) {
                if (openIndex === 'all') {
                    self.expandAll();
                } else {
                    self.collapseAll();
                    var indexes = [].concat(openIndex);
                    if (self.options.singleOpen) {
                        self.expand(indexes[0]);
                    } else {
                        core.each(indexes, function (index) {
                            self.expand(index);
                        });
                    }
                }
            }
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvent: function _bindEvent() {
            var self = this,
                o = self.options;

            // 토글버튼 클릭됐을 때
            //@gurumii: 선택자 조합에 해당하는 태그 구성요소에 대한 이벤트 ( click, dbclick ) 발생시

            var accord_flag = false; //[20191203] 앱접근성 :  ios13.2.3에서 이중실행방지

            self.on("click dblclick", o.itemSelector + o.toggleSelector, function (e) {
                e.preventDefault();
                //self.updateSelectors();

                if (!accord_flag) { //[20191203] 앱접근성 :  ios13.2.3에서 이중실행방지
					accord_flag = true; //[20191203] 앱접근성 :  ios13.2.3에서 이중실행방지

                    var $item = $(this).closest(o.itemClosest),
                        //@gurumii: 이벤트 객체에서 부모 li 까지 search > default: li
                        $items = self._findItems(),
                        //@gurumii: 하위객체들 검색후 리턴
                        index = $items.index($item); //@gurumii: 클릭 이벤트의 해당 하는 item index

                    if ($item.hasClass(o.selectedClass)) {
                        //@gurumii: on클랙스가 없으면 index에 해당하는 구성요소를 show
                        self.collapse(index, true, function () {
                            //@gurumii: 닫은후 active 클래스 할당 ( css style 정의후 시각적 표현 가능 )
                            $item.addClass(o.activeClass);
                        });
                    } else {
                        self.expand(index, true);

                    }

                    //[20191203] 앱접근성 :  ios13.2.3에서 이중실행방지
					setTimeout(function () {
						accord_flag = false;
					}, 800);
				}

            });

            /**
             * @gurumii:
             * accordion:beforeCollapse 이벤트 ( 닫기전 )가 발생될때
             * data-accord-group attribute 그룹으로 묶여 있는 요소중
             * 선택된 요소를 제외한 나머지 그룹요소들을 닫은후
             * 하위 컨텐츠 ( li )에 해당하는 요소들에 on 클래스를 제거
             *  */
            if (o.accordGroup && o.singleOpen) {
                // 아코디언 요소가 따로 떨어져 있는 것을 data-accord-group속성을 묶고,
                // 하나가 열리면 그룹으로 묶여진 다른 아코디언에 열려진게 있으면 닫아준다.
                self.on(eventBeforeExpand, function (e) {
                    $('.ui_accordion[data-accord-group=' + o.accordGroup + '], ' + '.ui_accordion_list[data-accord-group=' + o.accordGroup + ']').not(self.$el).vcAccordion('collapse').find(o.itemSelector).removeClass(o.selectedClass);
                });
            }
        },

        //@gurumii: 선택되어져 있는 items중 on클래스가 있는요소를 리턴
        _findSelected: function _findSelected() {
            return this.$items.filter('.' + self.options.selectedClass);
        },

        // 재정의
        _findItems: function _findItems() {
            var self = this,
                o = self.options,
                $items;

            //@gurumii: detailview의 정의?
            if (o.accordType === 'detailview') {
                $items = self.$el;
            } else {
                $items = o.itemSelector ? self.$(o.itemSelector) : self.$el;
            }
            return $items;
        },

        /**
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeCollapse
         * @fires vcui.ui,Accordion#accordion:collapse
         */
        collapse: function collapse(index, isAni, cb) {
            var self = this,
                opts = self.options,
                data = {},
                // 애니메이션 시간		//@gurumii: callback 이벤트에 전달할 파라미터 객체
                $items = self._findItems();

            //@gurumii: 파라미터나 선택된 index가 없을때 on클래스가 들어가 있는 요소의 index를 리턴
            if (arguments.length === 0 || index === null) {
                // index가 안넘어보면 현재 활성화된 패널의 index를 갖고 온다.
                index = $items.filter('.' + opts.selectedClass).index();
            }

            if (index < 0) {
                return;
            }

            data.index = index; //@gurumii: 선택된 요소의 index
            data.header = $items.eq(index); //@gurumii: 선택 index에 대한 li
            data.content = data.header.find(opts.contentSelector); //@gurumii: 선택된 li의 하위의 보여지는 ( 시각적 ) contents 구성요소

            /**
             * 닫히기 전에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordionbeforecollapse
             * @type {object}
             * @property {number} index 접혀질 인덱스번호
             */
            var ev = $.Event(eventBeforeCollapse);
            self.$el.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }

            /**
             * 닫힌 후에 발생하는 이벤트
             * @event vcui.ui.Accordion#accordioncollapse
             * @type {object}
             * @property {number} index 닫힌 인덱스 번호
             */
            if (isAni !== false) {
                // 애니메이션 모드
                //if(this.isAnimate) { return; }
                data.header.removeClass(opts.selectedClass); //@gurumii: li에 on클래스 제거 style effect
                data.content.slideUp(opts.duration, function () {
                    //@gurumii: 닫히는 에니메이션에 대한 모션이 끝난후
                    // 닫혀진 후에 이벤트 발생
                    self.trigger(eventCollapse, data); //@gurumii: slideUp 모션 종료후 accordion:collapse 이벤트 발생
                    self._updateButton(index, false); //@gurumii: 대체 텍스트및 타이틀 치환
                    cb && cb(); //@gurumii: callback 함수 실행
                });

                // [2019개편] aria-extended, aria-hidden 닫힐때 적용
                data.header.children('.head').children('.ui_accord_toggle').attr('aria-expanded','false');
                data.content.attr('aria-hidden','true');
                if ( $('body').hasClass('body_bg') ) {
                    var ariaRol = $('section.det_cons');
                    ariaRol.find('.alink.ui_accord_toggle').attr('aria-expanded','false');
                }

            } else {
                // 일반 모드
                data.header.removeClass(opts.selectedClass); //@gurumii: li에 on클래스 제거
                data.content.hide(); //@gurumii: content 숨김
                // 닫혀진 후에 이벤트 발생
                self.trigger(eventCollapse, data); //@gurumii: accordion:collapse 이벤트 발생
                self._updateButton(index, false); //@gurumii: 대체 텍스트및 타이틀 치환
                cb && cb(); //@gurumii: callback 함수 실행


            }
        },

        /**
         * 확장시키기
         * @param {number} index 인댁스
         * @param {boolean} isAni 애니메이션 여부
         * @param {function} callback 콜백함수
         * @fires vcui.ui,Accordion#accordion:beforeExpand
         * @fires vcui.ui,Accordion#accordion:expand
         */
        expand: function expand(index, isAni, callback) {
            var self = this,
                opts = self.options,
                $items,
                oldItem,
                oldIndex,
                newItem,
                data;

            if (arguments.length === 0) {
                return;
            }

            $items = self._findItems();
            newItem = $items.eq(index);
            oldItem = $items.filter('.' + opts.selectedClass);
            oldIndex = oldItem.index();
            data = {
                index: index,
                header: newItem,
                oldIndex: oldIndex,
                oldHeader: oldIndex < 0 ? null : oldItem
            };

            if (data.index === data.oldIndex) {
                return;
            }

            data.content = newItem.find(opts.contentSelector);
            data.oldContent = oldIndex < 0 ? null : oldItem.find(opts.contentSelector);

            /**
             * 열리기 전에 이벤트 발생
             * @event vcui.ui.Accordion#accordionbeforeexpand
             * @type {object}
             * @property {number} index 열린 인덱스
             */
            var ev = $.Event(eventBeforeExpand);
            self.triggerHandler(ev, data);
            if (ev.isDefaultPrevented()) {
                return;
            }
            /**
             * @event vcui.ui.Accordion#accordionexpand
             * @type {object}
             * @property {number} index 열린 인덱스.
             */
            if (isAni !== false) {
                // 애니메이션 사용
                self.isAnimate = true;
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.slideUp(opts.duration, function () {
                        self._updateButton(data.oldIndex, false);
                        callback && callback();
                    });
                }
                data.header.addClass(opts.selectedClass);
                data.content.slideDown(opts.duration, function () {
                    self.isAnimate = false;
                    // 열려진 후에 이벤트 발생
                    self.trigger(eventExpand, data);
                    self._updateButton(index, true);
                    callback && callback();

                    // [2019개편] 모아보기용 터치 스크롤이동
                    if ($('#wrap').hasClass('totalView_wrap')) {
                        $('html, body').stop(true).animate({
                            scrollTop: $(data.header).offset().top
                        }, {duration: 400});
                    }
                    // [2019개편] 메인에서 해당 아코디언 스크롤 이동
					// if ( ($('body').hasClass('body_bg')) && ($('.ui_accordion_ex').hasClass('on')) ) {
                    //     setTimeout(function() {
					// 	    ScrollView.moveTop();
					//     }, 400);
					// }
                    // [2019개편] aria-extended, aria-hidden 열릴떄 적용
                    data.header.children('.head').children('.ui_accord_toggle').attr('aria-expanded','true');
                    data.content.attr('aria-hidden','false');
					if ( $('body').hasClass('body_bg') ) {
                        var ariaRol = $('section.det_cons');
                        ariaRol.find('.alink.ui_accord_toggle').attr('aria-expanded','true');
					}

                });
            } else {
                // 에니메이션 미사용
                if (opts.singleOpen && data.oldHeader) {
                    // 하나만 열리는 모드
                    data.oldHeader.removeClass(opts.selectedClass);
                    data.oldContent.hide();
                }
                data.header.addClass(opts.selectedClass);
                data.content.show();

                // 열려진 후에 이벤트 발생
                self.trigger(eventExpand, data);
                self._updateButton(index, true);
                callback && callback();
            }
        },

        getActivate: function getActivate() {
            var self = this,
                o = self.options,
                item = self._findItems().filter('.' + o.selectedClass);

            if (item.length === 0) {
                return {
                    index: -1,
                    header: null,
                    content: null
                };
            } else {
                return {
                    index: item.index(),
                    header: item,
                    content: item.find(o.contentSelector)
                };
            }
        },

        _updateButton: function _updateButton(index, toggle) {
            var self = this,
                options = self.options,
                activeClass = options.activeClass,
                toggleClass = options.toggleButtonClass,
                $btn = self._findItems().eq(index).find(options.toggleSelector);

            if ($btn.is('a')) {
                if (toggle) {
                    $btn.parent().parent().removeClass(activeClass).addClass(toggleClass);
                    $btn.find('.btn_txt').html('닫기');
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-close-text') || '닫기';
                    }).parent().parent().replaceClass('btn_open', 'btn_close');
                } else {
                    $btn.parent().parent().removeClass(toggleClass);
                    $btn.find('.btn_txt').html('상세보기');
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-open-text') || '상세보기';
                    }).parent().parent().replaceClass('btn_close', 'btn_open');
                }
            } else {
                if (toggle) {
                    $btn.find('.btn_txt').html('닫기');
                    $btn.replaceClass('btn_open', 'btn_close').parent().parent().removeClass(activeClass).addClass(toggleClass);
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-close-text') || '닫기';
                    });
                } else {
                    $btn.find('.btn_txt').html('상세보기');
                    $btn.replaceClass('btn_close', 'btn_open').parent().parent().removeClass(toggleClass);
                    $btn.find('.ui_accord_text').html(function () {
                        return $btn.attr('data-open-text') || '상세보기';
                    });
                }
            }
        },

        collapseAll: function collapseAll() {
            var self = this,
                count = self._findItems().size();

            self.collapseMode = 'all';
            for (var i = 0; i < count; i++) {
                self.collapse(i, false);
            }
            self.collapseMode = null;
        },

        expandAll: function expandAll() {
            if (this.options.singleOpen) {
                return;
            }
            var self = this,
                count = self._findItems().size();

            self.expandMode = 'all';
            for (var i = 0; i < count; i++) {
                self.expand(i, false);
            }
            self.expandMode = null;
        }

    });

    return Accordion;
});

/*!
 * @module vcui.ui.Modal
 * @license MIT License
 * @description 모달 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/modal', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    var $doc = $(document),
        $win = $(window),
        detect = core.detect,
        ui = core.ui,
        isTouch = detect.isTouch,
        _zIndex = 9000;

    var ModalManager = {
        templates: {
            wrap: '<div class="ui_modal_wrap" style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:auto;"></div>',
            dim: '<div class="ui_modal_dim" style="position:fixed;top:0;left:0;bottom:0;right:0;background:#000;"></div>',
            modal: '<div class="ui_modal ui_modal_ajax" style="display:none"></div>'
        },
        options: {
            opacity: 0.2
        },
        init: function init(options) {
            var self = this;

            self.options = core.extend(self.options, options);
            self.stack = [];
            self.active = null;

            self._bind();
        },

        _bind: function _bind() {
            var self = this;

            $win.on('resizeend.modalmanager', function () {
                for (var i = -1, modal; modal = self.stack[++i];) {
                    modal.isShown && modal.center();
                }
            });

            $doc
                .on('modalshow.modalmanager', '.ui_modal_container', self._handleModalShow.bind(self))
                .on('modalshown.modalmanager', '.ui_modal_container', self._handleModalShown.bind(self))
                .on('modalhidden.modalmanager', '.ui_modal_container', self._handleModalHidden.bind(self))
                .on('modalhide.modalmanager', '.ui_modal_container', self._handleModalHide.bind(self))
                .on('focusin.modalmanager', self._handleFocusin.bind(self))
                .on('click.modalmanager', '[data-control=modal]', self._handleClick.bind(self))
                .on('click.modalmanager', '.ui_modal_dim', self._handleDimClick.bind(self));
        },
        _handleModalHide: function _handleModalHide(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance');

            // 모달이 전부 닫힐 때 document에 알린다.
            if (self.stack.length === 1) {
                $('body').removeClass('modal_show');
                $(document).triggerHandler('modallastbeforeclose');
            }
        },
        _handleModalShow: function _handleModalShow(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance'),
                zIndex = self.nextZIndex();

            if (modal.$el) {
                if (!modal.$el.parent().hasClass('ui_modal_wrap')) {
                    modal.$el.wrap(self.templates.wrap);
                    modal.$el.before($(self.templates.dim).css('opacity', self.options.opacity));
                }
                modal.$el.parent().css('zIndex', zIndex++).on('touchmove', function (e) {
                    if (modal.$el.hasClass('lay_alert')) {
                        e.preventDefault();
                    }
                });
            }

            self.active = modal;
            self.add(modal);
            if (self.stack.length === 1) {
                $(document).triggerHandler('modalfirstopen');
            }
        },
        _handleModalShown: function (e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance');

            if (!modal.$el.hasClass('lay_alert')) {
                $('body').addClass('modal_show');
            }
        },
        _handleModalHidden: function _handleModalHidden(e) {
            var self = this,
                $modal = $(e.currentTarget),
                modal = $modal.vcModal('instance');

            modal.$el.siblings('.ui_modal_dim').remove();
            modal.$el.parent().off();
            modal.$el.unwrap();
            self.revertZIndex();
            self.remove(modal);

            if (self.stack.length) {
                self.active = self.stack[self.stack.length - 1];
            } else {
                self.active = null;
                $(document).triggerHandler('modallastclose');
            }
        },
        _handleFocusin: function _handleFocusin(e) {
            var self = this;

            if (!self.active) {
                return;
            }
            if (self.active.$el[0] !== e.target && !$.contains(self.active.$el[0], e.target)) {
                self.active.$el.find(':focusable').first().focus();
                e.stopPropagation();
            }
        },
        _handleClick: function _handleClick(e) {
            e.preventDefault();

            var self = this,
                $el = $(e.currentTarget),
                target = $el.attr('href') || $el.attr('data-href'),
                $modal;

            if (target) {
                // ajax형 모달인 경우
                if (!/^#/.test(target)) {
                    $.ajax({
                        url: target
                    }).done(function (html) {
                        $modal = ModalManager.getRealModal(html);

                        $modal.addClass('ui_modal_ajax').hide().appendTo('body').vcModal(core.extend({
                            removeOnClose: true,
                            opener: $el[0]
                        }, $el.data())).on('modalhidden', function (e) {
                            $el[0].focus();
                            $modal.off('modalhidden');
                        });
                    });
                } else {
                    // 인페이지 모달인 경우
                    $(target).vcModal(core.extend({
                        opener: $el[0]
                    },$el.data())).on('modalhidden', function (e) {
                        $el[0].focus();
                        $(this).off('modalhidden');
                    });
                }
            }
        },
        _handleDimClick: function _handleDimClick(e) {
            var $dim = $(e.currentTarget);
            if ($dim.hasClass('ui_modal_dim')) {
                var modal = $dim.siblings('.ui_modal_container').vcModal('instance');
                if (modal.getOption('closeByDimmed') === true) {
                    modal.close();
                }
            }
        },
        add: function add(modal) {
            this.stack.push(modal);
        },
        remove: function remove(modal) {
            this.stack = core.array.remove(this.stack, modal);
        },
        nextZIndex: function nextZIndex() {
            var zi = _zIndex;
            _zIndex += 2;
            return zi;
        },
        revertZIndex: function revertZIndex() {
            _zIndex -= 2;
        },
        getRealModal: function (html) {
            var $tmp = $(html),
                $modal;
            if ($tmp.length > 1) {
                for (var i = 0, len = $tmp.length; i < len; i++) {
                    if ($tmp[i].nodeType === Node.ELEMENT_NODE) {
                        return $tmp.eq(i);
                    }
                }
            }
            return $tmp;
        }
    };
    ModalManager.init();

    function setVoiceOverFocus(element) {
        var focusInterval = 10; // ms, time between function calls
        var focusTotalRepetitions = 10; // number of repetitions

        element.setAttribute('tabindex', '0');
        element.blur();

        var focusRepetitions = 0;
        var interval = window.setInterval(function() {
            element.focus();
            focusRepetitions++;
            if (focusRepetitions >= focusTotalRepetitions) {
                window.clearInterval(interval);
            }
        }, focusInterval);
    }

    // Modal ////////////////////////////////////////////////////////////////////////////
    /**
     * 모달 클래스
     * @class
     * @name vcui.ui.Modal
     * @extends vcui.ui.View
     */
    var Modal = ui('Modal', /** @lends vcui.ui.Modal# */{
        bindjQuery: 'modal',
        defaults: {
            overlay: true,
            clone: true,
            closeByEscape: true,
            removeOnClose: false,
            closeByDimmed: false,
            draggable: true,
            dragHandle: 'header h1',
            show: true,
            effect: 'fade', // slide | fade
            cssTitle: '.ui_modal_title',
            useTransformAlign: true,
            variableWidth: true,
            variableHeight: true
        },

        events: {
            'click button[data-role], a[data-role]': function clickButtonDataRole(e) {
                var self = this,
                    $btn = $(e.currentTarget),
                    role = $btn.attr('data-role') || '',
                    ev;

                if (role) {
                    self.triggerHandler(ev = $.Event('modal' + role), [self]);
                    if (ev.isDefaultPrevented()) {
                        return;
                    }
                }

                this.close();
            },
            'click .ui_modal_close': function clickUi_modal_closeui_modal_close(e) {
                e.preventDefault();
                e.stopPropagation();

                //앱에서 back시 상태값 변경이 필요.
                detailPopFlag = false;


                this.close();
            }
        },
        /**
         * 생성자
         * @param {String|Element|jQuery} el
         * @param {Object} options
         * @param {Boolean}  options.overlay:true 오버레이를 깔것인가
         * @param {Boolean}  options.clone: true    복제해서 띄울 것인가
         * @param {Boolean}  options.closeByEscape: true    // esc키를 눌렀을 때 닫히게 할 것인가
         * @param {Boolean}  options.removeOnClose: false   // 닫을 때 dom를 삭제할것인가
         * @param {Boolean}  options.draggable: true                // 드래그를 적용할 것인가
         * @param {Boolean}  options.dragHandle: 'h1.title'     // 드래그대상 요소
         * @param {Boolean}  options.show: true                 // 호출할 때 바로 표시할 것인가...
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            // 열릴때 body로 옮겼다가, 닫힐 때 다시 원복하기 위해 임시요소를 넣어놓는다.
            self._createHolder();
            if (self.options.overlay !== false) {
                self._overlay(); // 오버레이 생성
            }
            self.$el.addClass('ui_modal_container');

            self.isShown = false;
            self._originalDisplay = self.$el.css('display');

            if (/[0-9]+px/.test(self.$el[0].style.left)) {
                self.options.variableWidth = false;
            }

            if (/[0-9]+px/.test(self.$el[0].style.top)) {
                self.options.variableHeight = false;
            }

            if (self.options.show) {
                setTimeout(function () {
                    core.util.waitImageLoad(self.$('img')).done(function () {
                        self.show();
                    });
                });
            }

            self._bindAria(); // aria 셋팅
        },

        _bindAria: function _bindAria() {
            var self = this;
            // TODO
            self.$el.attr({
                'role': 'dialog',
                'aria-hidden': 'false',
                'aria-describedby': self.$('section').attr('id') || self.$('section').attr('id', self.cid + '_content').attr('id'),
                'aria-labelledby': self.$('h1').attr('id') || self.$('h1').attr('id', self.cid + '_title').attr('id')
            });
        },
        /**
         * zindex때문에 모달을 body바로 위로 옮긴 후에 띄우는데, 닫을 때 원래 위치로 복구시켜야 하므로,
         * 원래 위치에 임시 홀더를 만들어 놓는다.
         * @private
         */
        _createHolder: function _createHolder() {
            var self = this;

            if (self.$el.parent().is('body')) {
                return;
            }

            self.$holder = $('<span class="ui_modal_holder" style="display:none;"></span>').insertAfter(self.$el);
            self.$el.appendTo('body');
        },
        /**
         * 원래 위치로 복구시키고 홀더는 제거
         * @private
         */
        _replaceHolder: function _replaceHolder() {
            var self = this;

            if (self.$holder) {
                self.$el.insertBefore(self.$holder);
                self.$holder.remove();
            }
        },

        getOpener: function getOpener() {
            return $(this.options.opener);
        },

        /**
         * 토글
         */
        toggle: function toggle() {
            var self = this;

            self[self.isShown ? 'hide' : 'show']();
        },

        /**
         * 표시
         */
        show: function show() {
            if (this.isShown) {
                return;
            }

            var self = this,
                opts = self.options,
                showEvent = $.Event('modalshow');

            self.trigger(showEvent);
            if (showEvent.isDefaultPrevented()) {
                return;
            }

            self.isShown = true;

            if (opts.title) {
                self.$(opts.cssTitle).html(opts.title || '알림');
            }

            self.layout();
            var defer = $.Deferred();
            if (opts.effect === 'fade') {
                self.$el.hide().fadeIn('slow', function () {
                    defer.resolve();
                });
            } else if (opts.effect === 'slide') {
                self.$el.css('top', -self.$el.height()).animate({ top: '50%' }, function () {
                    defer.resolve();
                });
            } else {
                self.$el.show();
                defer.resolve();
            }

            defer.done(function () {
                self.trigger('modalshown', {
                    module: self
                });

                //////$('body').attr('aria-hidden', 'true');    // body를 비활성화(aria)
                self._draggabled(); // 드래그 기능 빌드
                self._escape(); // esc키이벤트 바인딩
                self.$el.css('min-height', self.$el.css('min-height', '').prop('scrollHeight'));
                ///////////me._enforceFocus();   // 탭키로 포커스를 이동시킬 때 포커스가 레이어팝업 안에서만 돌도록 빌드

                self.on('mousewheel', function (e) {
                    e.stopPropagation();
                });

                var $focusEl = self.$el.find('[data-autofocus=true]');

                // 레이어내에 data-autofocus를 가진 엘리먼트에 포커스를 준다.
                if ($focusEl.length > 0) {
                    $focusEl.eq(0).focus();
                } else {
                    // 레이어에 포커싱
                    self.$el.attr('tabindex', 0).focus();
                }

                var $focusEl = self.$('[data-autofocus=true]');
                if ($focusEl.length > 0) {
                    $focusEl.eq(0).focus();
                } else {
                    setVoiceOverFocus(self.$el.attr('tabindex', 0).get(0));
                }

                // 버튼
                /**************if (me.options.opener) {
                    var modalid;
                    if (!(modalid = me.$el.attr('id'))) {
                        modalid = 'modal_' + core.getUniqId(16);
                        me.$el.attr('id', modalid);
                    }
                    $(me.options.opener).attr('aria-controls', modalid);
                }**********/
            });
        },

        /**
         * 숨김
         */
        hide: function hide(e) {
            if (e) {
                e.preventDefault();
            }

            var self = this;
            e = $.Event('modalhide');
            self.trigger(e);
            if (!self.isShown || e.isDefaultPrevented()) {
                return;
            }

            var defer = $.Deferred();
            self.isShown = false;
            if (self.options.effect === 'fade') {
                self.$el.fadeOut('slow', function () {
                    defer.resolve();
                });
            } else if (self.options.effect === 'slide') {
                self.$el.animate({
                    top: -self.$el.outerHeight()
                }, function () {
                    defer.resolve();
                });
            } else {
                self.$el.hide();
                defer.resolve();
            }

            defer.done(function () {
                self.trigger('modalhidden');

                self.$el.removeClass('ui_modal_container'); // dom에 추가된 것들 제거
                self._escape(); // esc 키이벤트 제거
                self._replaceHolder(); // body밑으로 뺀 el를 다시 원래 위치로 되돌린다.

                if (self.options.removeOnClose) {
                    self.$el.remove(); // 닫힐 때 dom에서 삭제하도록 옵션이 지정돼있으면, dom에서 삭제한다.
                }
                /*if (me.options.opener) {
                 $(me.options.opener).removeAttr('aria-controls').focus();    // 레이어팝업을 띄운 버튼에 포커스를 준다.
                 }*/
                //:if (self.$overlay) {
                //:    self.$overlay.remove(), self.$overlay = null;    // 오버레이를 제거
                //:}
                ////// $('body').removeAttr('aria-hidden');    // 비활성화를 푼다.

                self.destroy();
            });
        },

        /**
         * 도큐먼트의 가운데에 위치하도록 지정
         */
        layout: function layout() {
            var self = this,
                width,
                height,
                css,
                isOverHeight,
                isOverWidth,
                top,
                left,
                winHeight = core.dom.getWinHeight(),
                winWidth = core.dom.getWinWidth(),
                scrollHeight = self.$el.css('min-height', '').prop('scrollHeight');

            if (!self.isShown) {
                self.$el.css({
                    'display': 'inline'
                });
            }
            width = self.$el.outerWidth();
            height = self.$el.outerHeight();
            isOverHeight = height > winHeight;
            isOverWidth = width > winWidth;
            css = {
                display: 'block',
                position: 'absolute',
                //backgroundColor: '#ffffff',
                outline: 'none',
                minHeight: scrollHeight,
                backgroundClip: 'padding-box'//,
                //top: top = isOverHeight ? '0%' : '50%'//,
                //left: left = isOverWidth ? '0%' : '50%'
            };

            css.transform = '';
            if (self.options.variableWidth !== false) {
                css.left = isOverWidth ? '0%' : '50%';
                if (self.options.useTransformAlign) {
                    css.transform += 'translateX(-' + css.left + ') ';
                } else {
                    css.marginLeft = isOverWidth ? '' : Math.ceil(width / 2) * -1;
                }
            }

            if (self.options.variableHeight !== false) {
                css.top = isOverHeight ? '0%' : '50%';
                if (self.options.useTransformAlign) {
                    css.transform += 'translateY(-' + css.top + ') ';
                } else {
                    css.marginTop = isOverHeight ? '' : Math.ceil(height / 2) * -1;
                }
            }

            self.$el.stop().css(css);
        },

        /**
         * 타이틀 영역을 드래그기능 빌드
         * @private
         */
        _draggabled: function _draggabled() {
            var self = this,
                options = self.options;

            if (!options.draggable || self.bindedDraggable) {
                return;
            }
            self.bindedDraggable = true;

            if (options.dragHandle) {
                self.$el.css('position', 'absolute');
                core.css3.prefix('user-select') && self.$(options.dragHandle).css(core.css3.prefix('user-select'), 'none');
                self.on('mousedown touchstart', options.dragHandle, function (e) {
                    e.preventDefault();

                    var isMouseDown = true,
                        pos = self.$el.position(),
                        oriPos = {
                            left: e.pageX - pos.left,
                            top: e.pageY - pos.top
                        },
                        _handler;

                    $doc.on(self.makeEventNS('mousemove mouseup touchmove touchend touchcancel'), _handler = function handler(e) {
                        switch (e.type) {
                            case 'mousemove':
                            case 'touchmove':
                                if (!isMouseDown) {
                                    return;
                                }
                                self.$el.css({
                                    left: e.pageX - oriPos.left,
                                    top: e.pageY - oriPos.top
                                });
                                break;
                            case 'mouseup':
                            case 'touchend':
                            case 'touccancel':
                                isMouseDown = false;
                                $doc.off(self.getEventNS(), _handler);
                                break;
                        }
                    });
                });

                self.$(options.dragHandle).css('cursor', 'move');
            }
        },

        /**
         * 모달이 띄워진 상태에서 탭키를 누를 때, 모달안에서만 포커스가 움직이게
         * @private
         */
        _enforceFocus: function _enforceFocus() {
            if (!isTouch) {
                return;
            }
            var self = this;
            var $focusEl = self.$el.find('[data-autofocus=true]');

            // 레이어내에 data-autofocus를 가진 엘리먼트에 포커스를 준다.
            if ($focusEl.length > 0) {
                $focusEl.eq(0).focus();
            } else {
                // 레이어에 포커싱
                self.$el.attr('tabindex', 0).focus();
            }

            $doc.off('focusin' + self.getEventNS()).on('focusin' + self.getEventNS(), self.proxy(function (e) {
                if (self.$el[0] !== e.target && !$.contains(self.$el[0], e.target)) {
                    self.$el.find(':focusable').first().focus();
                    e.stopPropagation();
                }
            }));
        },

        /**
         * esc키를 누를 때 닫히도록
         * @private
         */
        _escape: function _escape() {
            if (isTouch) {
                return;
            }
            var self = this;

            if (self.isShown && self.options.closeByEscape) {
                self.docOff('keyup');
                self.docOn('keyup', function (e) {
                    e.which === 27 && self.hide();
                });
            } else {
                self.docOff('keyup');
            }
        },

        /**
         * 오버레이 생성
         * @private
         */
        _overlay: function _overlay() {
            return;

            var self = this;
            if (!self.options.overlay || self.$overlay) {
                return false;
            } //140123_추가

            self.$overlay = $('<div class="ui_modal_overlay" />');
            self.$overlay.css({
                'backgroundColor': '#ffffff',
                'opacity': 0.6,
                'position': 'fixed',
                'top': 0,
                'left': 0,
                'right': 0,
                'bottom': 0
            }).appendTo('body');

            self.$overlay.off('click.modal').on('click.modal', function (e) {
                if (e.target != e.currentTarget) {
                    return;
                }
                self.$overlay.off('click.modal');
                self.hide();
            });
        },

        /**
         * 모달의 사이즈가 변경되었을 때 가운데위치를 재조절
         * @example
         * $('...').modal(); // 모달을 띄운다.
         * $('...').find('.content').html( '...');  // 모달내부의 컨텐츠를 변경
         * $('...').modal('center');    // 컨텐츠의 변경으로 인해 사이즈가 변경되었으로, 사이즈에 따라 화면가운데로 강제 이동
         */
        center: function center() {
            this.layout();
        },

        /**
         * 열기
         */
        open: function open() {
            this.show();
        },

        /**
         * 닫기
         */
        close: function close() {
            this.hide();
        },

        /**
         *
         */
        destroy: function destroy() {
            var self = this;

            self.supr();
        }
    });

    /**
     * 열려 있는 레이어팝업을 가운데에 위치시키는 글로벌이벤트
     * @example
     * vcui.PubSub.trigger('resize:modal')
     */
    /*core.PubSub.on('resize:modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    //윈도우가 리사이징 될때 가운데에 자동으로 위치시킴
    /*$(window).on('resize.modal', function() {
     if(Modal.active){
     Modal.active.center();
     }
     });*/

    core.modal = function (el, options) {
        $(el).vcModal(options);
    };

    /**
     * @class
     * @name vcui.ui.AjaxModal
     * @description ajax로 불러들인 컨텐츠를 모달로 띄워주는 모듈
     * @extends vcui.ui.View
     */
    core.ui.ajaxModal = function (ajaxOptions, options) {
        if (typeof ajaxOptions === 'string') {
            ajaxOptions = {
                url: ajaxOptions
            };
        }
        return $.ajax(ajaxOptions).then(function (html) {
            var $modal = ModalManager.getRealModal(html).appendTo('body').data('removeOnClose', true);
            return $modal.vcModal(core.extend(options, {
                removeOnClose: true,
                events: {
                    modalhidden: function () {
                        $(options.opener).focus();
                    }
                }
            }));
        });
    };

    core.ui.alert = function () {
        /**
         * 얼럿레이어
         * @memberOf vcui.ui
         * @name alert
         * @function
         * @param {string} msg 얼럿 메세지
         * @param {Object} options 모달 옵션
         * @example
         * vcui.ui.alert('안녕하세요');
         */
        return function (msg, options) {
            if (typeof msg !== 'string' && arguments.length === 0) {
                options = msg;
                msg = '';
            }
            var el = $(core.ui.alert.tmpl).appendTo('body').find('div.ui_modal_content').html(msg).end();
            var modal = $(el).vcModal(core.extend({ removeOnClose: true }, options)).vcModal('instance');
            modal.getElement().buildUIControls();
            modal.on('modalhidden', function () {
                el = null;
                modal = null;
            });
            return modal;
        };
    }();
    core.ui.alert.tmpl = ['<div class="layer_popup small ui_alert" role="alert" style="display:none">', '<h1 class="title ui_modal_title">알림창</h1>', '<div class="cntt">', '<div class="ui_modal_content">&nbsp;</div>', '<div class="wrap_btn_c">', '<button type="button" class="btn_emphs_small" data-role="ok"><span><span>확인</span></span></button>', '</div>', '</div>', '<button type="button" class="ui_modal_close"><span>닫기</span></button>', '<span class="shadow"></span>', '</div>'].join('');
    ///////////////////////////////////////////////////////////////////////////////////////

    return Modal;
});
/*!
 * @module vcui.ui.Tab
 * @license MIT License
 * @description 탭 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tab', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    var name = 'tab',
        eventBeforeChange = name + 'beforechange',
        eventChanged = name + 'change',
        selectedClass = 'on';

    var prefixClass = '.ui_tab_';
    /**
     * @class
     * @name vcui.ui.Tab
     * @description 페이징모듈
     * @extends vcui.ui.View
     */
    var Tab = core.ui('Tab', /** @lends vcui.ui.Tab# */{
        bindjQuery: 'tab',
        $statics: /** @lends vcui.ui.Tab */{
            ON_CHANGE: eventBeforeChange,
            ON_CHANGED: eventChanged
        },
        defaults: {
            selectedIndex: 0,
            selectedClass: selectedClass,
            selectedText: '선택됨'
        },

        selectors: {
            tabs: prefixClass + 'nav'
        },
        /**
         * 생성자
         * @param {string|Element|jQuery} el 해당 엘리먼트(노드, id, jQuery 어떤 형식이든 상관없다)
         * @param {object} [options] 옵션값
         * @param {number} [options.selectedIndex = 0]  초기선택값
         * @param {string} [options.selectedClass = 'on'] 활성 css클래스명
         * @param {string} [options.tabType = 'inner'] 탭형식(inner | outer)
         */
        initialize: function initialize(el, options) {
            var self = this;
            if (self.supr(el, options) === false) {
                return;
            }

            if (self.$tabs.find('.hide')) {
                self.$srText = self.$tabs.find('.hide:first');
            } else {
                self.$srText = $('<em class="hide">' + self.options.selectedText + '</em>'); // screen reader text element
            }

            self._findControls();
            self._buildARIA();
            self._bindEvents();

            var index = self.$tabs.filter('.' + selectedClass).index();
            if (index >= 0) {
                self.options.selectedIndex = index;
            }
            self.select(self.options.selectedIndex);
        },

        _findControls: function _findControls() {
            var self = this;
            var selectors = [];

            // 탭버튼의 href에 있는 #아이디 를 가져와서 컨텐츠를 조회
            self.$tabs.each(function () {
                var href = $(this).find('a').attr('href');
                if (href && /^(#|\.)\w+/.test(href)) {
                    selectors.push(href);
                }
            });

            if (selectors.length) {
                self.isOuterPanel = true;
                self.$contents = $(selectors.join(', '));
            } else {
                self.$contents = self.$(prefixClass + 'panel');
            }
        },

        /**
         * @private
         */
        _bindEvents: function _bindEvents() {
            var self = this;

            self.$tabs.on('click', '>a, >button', function (e) {
                e.preventDefault();

                self.select($(e.currentTarget).parent().index());
            }).on('keydown', '>a', function (e) {
                var index = self.$tabs.filter('.' + selectedClass).index(),
                    newIndex;

                switch (e.which) {
                    case core.keyCode.RIGHT:
                        newIndex = Math.min(self.$tabs.size() - 1, index + 1);
                        break;
                    case core.keyCode.LEFT:
                        newIndex = Math.max(0, index - 1);
                        break;
                    default:
                        return;
                }
                self.select(newIndex);
                self.$tabs.eq(self.selectedIndex).find('>a').focus();
            });
        },

        /**
         * aria 속성 빌드
         * @private
         */
        _buildARIA: function _buildARIA() {
            var self = this,
                tablistid = self.cid,
                tabid;

            self.$el.attr('role', 'tablist');
            self.$tabs.each(function (i) {
                if (!self.$contents.eq(i).attr('id')) {
                    self.$contents.eq(i).attr('id', tabid = tablistid + '_' + i);
                }

                self.$contents.eq(i).attr({
                    'aria-labelledby': tabid,
                    'role': 'tabpanel',
                    'aria-hidden': 'true'
                });

                $(this).attr({
                    'id': tabid,
                    'role': 'tab',
                    'aria-selected': 'false',
                    'aria-controls': tabid
                });
            });

            self.on(eventChanged, function (e, data) {
                self.$tabs.attr('aria-selected', 'false').eq(data.selectedIndex).attr('aria-selected', 'true');

                self.$contents.attr('aria-hidden', 'true').eq(data.selectedIndex).attr('aria-hidden', 'false');
            });
        },

        /**
         * index에 해당하는 탭을 활성화
         * @param {number} index 탭버튼 인덱스
         * @fires vcui.ui.Tab#tabbeforechange
         * @fires vcui.ui.Tab#tabchange
         * @example
         * $('#tab').tab('select', 1);
         * // or
         * $('#tab').tab('instance').select(1);
         */
        select: function select(index) {
            var self = this,
                e;
            if (index < 0 || self.$tabs.length && index >= self.$tabs.length) {
                throw new Error('index 가 범위를 벗어났습니다.');
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabbeforechange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(e = $.Event(eventBeforeChange), {
                selectedIndex: index,
                relatedTarget: self.$tabs.get(index)
            });
            if (e.isDefaultPrevented()) {
                return;
            }

            self.selectedIndex = index;

            self.$tabs.not(self.$tabs.eq(index)).find('>a .hide').text("");

            self.$tabs.removeClass(selectedClass).attr('aria-selected', false).eq(index).addClass(selectedClass).attr('aria-selected', true).find('>a .hide').text(self.options.selectedText);
            //.append(self.$srText);


            // 컨텐츠가 li바깥에 위치한 탭인 경우
            if (self.isOuterPanel && self.$contents) {
                self.$contents.hide().eq(index).show();
            }

            /**
             * 탭이 바뀌기 직전에 발생. e.preventDefault()를 호출함으로써 탭변환을 취소할 수 있다.
             * @event vcui.ui.Tab#tabchange
             * @type {object}
             * @property {number} selectedIndex 선택된 탭버튼의 인덱스
             */
            self.triggerHandler(eventChanged, {selectedIndex: index});
        }
    });
    ///////////////////////////////////////////////////////////////////////////////////////

    return Tab;
});
/*!
 * @module vcui.ui.Tooltip
 * @license MIT License
 * @description 툴팁 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/tooltip', ['jquery', 'vcui'], function ($, core) {
    "use strict";

    /**
     * 툴팁 레이어
     * @class
     * @name scui.ui.Tooltip
     * @extends scui.ui.View
     */

    var Tooltip = core.ui('Tooltip', /** @lends scui.ui.Tooltip# */{
        $singleton: true,
        bindjQuery: 'tooltip',
        defaults: {
            interval: 200,
            attrName: "title"
        },
        templates: {
            tooltip: '<span class="ui-tooltip" role="tooltip" id="uiTooltip" style="z-index:100000;display:none;max-width:200px;height:auto;position:absolute;border:1px solid red;background:blue;" aria-hidden="true"></span>'
        },
        initialize: function initialize(el, options) {
            var self = this;

            if (self.supr(el, options) === false) {
                return;
            }

            self._bindEvents();
        },


        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function _bindEvents() {
            var self = this;
            var $tooltip = self.$tooltip = $(self.tmpl('tooltip')).appendTo('body');
            var attr = self.options.attrName;

            self.docOn('mouseenter mouseleave focusin focusout click', '[data-title]:not([disabled]), [' + attr + ']:not([disabled])', function (e) {

                switch (e.type) {
                    case 'mouseenter':
                    case 'focusin':
                        var el = self.activeEl = this,
                            title = '';

                        title = core.string.escapeHTML(el.getAttribute(attr) || el.getAttribute('data-title'));
                        if (!title) {
                            self._close(false);
                            return;
                        }

                        if (attr === 'title' && el.getAttribute(attr)) {
                            el.setAttribute('data-title', el.getAttribute(attr));
                            el.setAttribute('aria-describedby', 'uiTooltip');
                            el.removeAttribute(attr);
                        }
                        self.showTimer = setTimeout(function () {
                            if (!el || !title) {
                                return;
                            }

                            var measure = core.dom.getDimensions(el);
                            if (measure.left === 0 && measure.top === 0) {
                                self._close();
                                return;
                            }

                            $tooltip.get(0).innerText = title;
                            var isUpOut = measure.top - measure.height < 0,
                                tooltipWidth = $tooltip.outerWidth(),
                                tooltipHeight = $tooltip.outerHeight(),
                                diff = measure.width - tooltipWidth,
                                pos = {};

                            if (isUpOut) {
                                $tooltip.removeClass('top bottom').addClass('top');
                                pos.top = measure.top + measure.height + 4;
                            } else {
                                $tooltip.removeClass('top bottom').addClass('bottom');
                                pos.top = measure.top - tooltipHeight - 6;
                            }
                            pos.left = measure.left + diff / 2 + core.dom.getScrollLeft();
                            pos.top += core.dom.getScrollTop();

                            $tooltip.css(pos).fadeIn('fast');
                            $tooltip.attr('aria-hidden', 'false');
                            self.isShow = true;
                        }, 500);
                        break;
                    case 'mouseleave':
                    case 'focusout':
                        self._close();
                        break;
                }
            }).on('mousedown', function () {
                self._close();
            });
        },
        _close: function _close(effect) {
            var self = this;
            clearTimeout(self.showTimer);
            clearTimeout(self.hideTimer);
            self.hideTimer = self.showTimer = null;

            if (self.activeEl) {
                self.activeEl = null;
            }

            if (!self.isShow) {
                return;
            }
            self.isShow = false;

            if (effect) {
                self.$tooltip.fadeOut('fast');
            } else {
                self.$tooltip.hide();
            }
            self.$tooltip.attr('aria-hidden', 'true');
        }
    });

    return Tooltip;

});

$.fn.buildCommonUI = function () {
    vcui.require(['ui/accordion', 'ui/tab'], function () {
        this.find('.ui_accordion').vcAccordion();
        this.find('.ui_tab').vcTab();
    }.bind(this));
    return this;
};
