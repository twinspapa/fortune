/*!
 * @module vcui.ui.BeautifyForm
 * @license MIT License
 * @description BeautifyForm 컴포넌트
 * @copyright VinylC UID Group
 */
define('ui/beautifyForm', [
    'jquery',
    'vcui'
], function ($, core) {
    "use strict";

    return core.ui('BeautifyForm', {
        bindjQuery: true, // 상단컴포넌트이름으로 바인딩
        defaults: {
            validate: function ($el) {

            }
        },
        initialize: function (el, options) {
            var self = this;
            if (self.supr(el, options) === false) { return; }

            self._bindEvents();

            setTimeout(function () {
                // 처음에 로딩되었을 때 한번 체크해준다.
                self._validate();
            }, 0);
        },

        /**
         * 이벤트 바인딩
         * @private
         */
        _bindEvents: function () {
            var self = this;

            self.on('focusin focusout input change', '.if_wrap :input, .chk_wrap :input, .rad_wrap :input', function (e) {
                var $el = $(this),
                    $wrap = $el.closest('.if_wrap');

                // 읽기전용은 무시
                if ($wrap.hasClass('read')){ return; }

                switch(e.type) {
                    case 'focusin':
                        $wrap.removeClass('on over').addClass('over');
                        break;
                    case 'focusout':
                        $wrap.removeClass('on over').addClass($el.trimVal() ? 'on' : '');
                        self._validate();
                        break;
                    case 'input':
                    case 'change':
                        self._validate();
                        break;
                }
            });

            // 폼의 submit방식으로 처리하고자 할 경우....개발에서 수정해서 쓰시길...
            /*self.on('submit', function (e) {
                if (self._checkValid()) {
                    var evt = $.Event('beautifyforminvalid');

                    // 만약에 앞단에서 e.preventDefault()를 실행했으면 서브밋을 막는다.
                    self.triggerHandler(evt);
                    if (evt.isDefaultPrevented()) {
                        e.preventDefault();
                    }

                } else {
                    e.preventDefault();
                    self.triggerHandler('beautifyforminvalid');
                }
            });*/
        },

        _checkValid: function () {
            var self = this,
                // 폼요소 추출
                $els = self.$el.find(':input:visible, input[type=hidden]');

            if ($els.length === 0) {
                return false;
            }

            for(var i = -1; $els.get(++i); ) {
                if (!self._checkRequire($els.eq(i)) || self.options.validate($els.eq(i)) === false) {
                    return false;
                }
            }

            return true;
        },

        /**
         * 필수 입력 체크
         * @param $el
         * @returns {boolean}
         * @private
         */
        _checkRequire: function ($el) {
            var self = this;

            if (!$el.data('required')) { return true; }

            // 체크,라디오일 때는 하나라도 체크했으면 통과시킴
            if ($el.is(':radio, :checkbox')) {
                return self.$el.find('[name="' + $el.attr('name') + '"]').filter(':checked').length > 0;
            }
            return !!$el.trimVal();
        },

        /**
         * 밸리데이션 체크
         * @private
         */
        _validate: function () {
            var self = this,
                valid = self._checkValid();

            self.triggerHandler('beautifyformvalidated', {invalid: !valid, valid: valid});
        },

        /**
         * 외부 호출용
         */
        validate: function () {
            this._validate();
        },

        update: function () {
            var self = this;

            self.$('.if_wrap :input').each(function () {
                var $el = $(this),
                    $wrap = $el.closest('.if_wrap');

                // 읽기전용은 무시
                if ($wrap.hasClass('read')){ return; }

                $wrap.removeClass('on over').addClass($el.trimVal() ? 'on' : '');
            });
            this._validate();
        },
        enabled: function (selector, flag) {
            var self = this;

            self.disabled(selector, !flag);
        },
        disabled: function (selector, flag) {
            var self = this,
                $el;

            ($el = self.$(selector)).prop('disabled', flag)
                .parent().toggleClass('disabled', flag);

            if (flag) {
                $el.val('');
            }

            self.update();
        },
        readonly: function (selector, flag) {
            var self = this;

            self.$(selector).prop('readonly', !flag)
                .parent().toggleClass('read', !flag);

            self.update();
        }
    });

});