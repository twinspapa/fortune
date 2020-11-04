/*!
* 1. 사이트 설정
* 2. 사이트 전반에 대한 기본처리
**/
vcui.require.config({
    paths: {
        'jquery.transit': 'libs/jquery.transit',
        'Raphael': 'libs/raphael.min'
    },
    waitSeconds: 15
});

/* 2018년 고도화 추가 */
//푸터 버튼영역이 있을경우 class 추가 2018
// $("#lay_wrap").children('.lay_footer').parents('#lay_wrap').addClass('lay_hasFoot');
var layerWrap = $('.lay_content').parent();
layerWrap.addClass('lay_wrap');                // 팝업에 class 추가
if (layerWrap.find('.lay_footer').length) {    // 푸터 버튼영역이 있을경우 class 추가
    layerWrap.addClass('lay_hasFoot');
}

// input type read-only일 경우 class 추가 2018. ios에서 충돌로 주석처리
// $(document).ready(function(){
// 	$('.if_wrap input:read-only,.af_wrap input:read-only').parent().addClass('read');
// });

//버튼 focus 이벤트
$(".btn_comm").focusin(function(){
	$(this).addClass('focus');
});
$(".btn_comm").focusout(function(){
	$(this).removeClass('focus');
});
// 텝+슬라이더
$(".tab_wrap .menu>li").click(function(){
	$('li').attr("aria-selected","false"); //deselect all the tabs
	$(this).attr("aria-selected","true");  // select this tab
	$(this).addClass('on').siblings('li').removeClass('on');
	var tabpanid= $(this).attr("aria-controls"); //find out what tab panel this tab controls
	var tabpan = $("#"+tabpanid);
	$(this).parents('.tab_links').siblings('.tab_conts').children().attr("aria-hidden","true");
	tabpan.attr("aria-hidden","false").addClass('on').siblings('').removeClass('on');  // show our panel
});

/* 2018년 고도화 추가 */

var site = {
    isLocal: window.location.hostname === 'localhost',
    isDev: window.location.hostname.indexOf('jsdebug=true') > -1,
    googleMapsAPIKey: '',
    /**
     * 모달이 열렸을 때 페이지 스크롤은 막는다.
     * @param flag
     */
    preventPageScroll: function (flag) {
        var $wrap = $('#wrap');

        if (flag) {
            var scrollTop = $(window).scrollTop();
            $wrap.css({'position': 'fixed', 'top': -scrollTop, 'min-height': scrollTop + window.innerHeight});
        } else {
            var top = parseInt($wrap.css('top'), 10) || 0;
            $wrap.css({'position': '', 'top': '', 'min-height': ''});
            $('html, body').scrollTop(-top);
        }
    },
    // 사이트 기본작업들 처리
    init: function () {
        this._preloadComponents();
        this._initInputNumberMaxlength();
    },
    // 주요 컴포넌트를 미리 로드
    _preloadComponents: function () {
        var self = this;

        $.holdReady(true); // ready 실행을 잠시 멈춘다.
        vcui.require([
            'ui/modal'
        ], function () {
            vcui.ui.setDefaults('Modal', {
                useTransformAlign: false
            });
            self._init();
            $.holdReady(false); // ready함수 실행을 허용(이전에 등록된건 실행해준다.)
        });
    },
    _init: function () {
        // 모달 기본옵션 설정: 모달이 들때 아무런 모션도 없도록 한다.(기본은 fade)
        vcui.ui.setDefaults('Modal', {
            effect: 'none'
        });

        // 모달이 열렸을 때 페이지 스크롤을 막기 위함
        $(document).on('modalfirstopen modallastclose', function (e) {
            site.preventPageScroll(e.type === 'modalfirstopen');
            $('#wrap').attr('aria-hidden', e.type === 'modalfirstopen' ? 'true' : 'false');
        }).on('modalshown', function (e) {
            $(e.target).buildCommonUI();
        });

        // 공통 UI 빌드
        $('body').buildCommonUI();
        this._buildGoTop(); //180220 기능추가

        // ios에서 키보드가 올라올 때 밑의 fixed 버튼을 안보이게 처리
        if (vcui.detect.isIOS) {
            $(document).on('focusin focusout', 'input, textarea, select, [contenteditable]', function (e) {
                $('#wrap').removeClass('hidden_fixed');

                if (this.readOnly) { return; }
                if (e.type === 'focusin') {
                    if (this.type === 'checkbox' || this.type === 'radio') {
                        return;
                    }
                    $('#wrap').addClass('hidden_fixed');
                }
            });
        }
    },

    /** 180220 기능추가
     * go top 기능 빌드
     * @private
     */
    _buildGoTop: function () {
        var $goTop = $('.float_top');

        if ($goTop.length) {
            $goTop.on('click', '.btn_top', function (e) {
                e.preventDefault();

                $('html, body').stop().animate({
                    scrollTop: 0
                }, 100);
            }).hide();

            var docHeight = 0;
            var winHeight = window.innerHeight;
            var isShown = undefined;
            var handler = function () {
                var y = vcui.dom.getScrollTop();
                var _isShown = y > 50;

                if (_isShown !== isShown) {
                    $goTop.toggle(_isShown);
                    isShown = _isShown;
                }
            };

            $(window)
                .on('load.gotop scrollend.gotop resizeend.gotop', function () {
                    docHeight = vcui.dom.getDocHeight();
                    winHeight = window.innerHeight;
                    handler();
                })
                .on('scroll.gotop', handler);
        }
    },
    // input type=number에는 maxlength 가 안먹어서 스크립트로 처리
    _initInputNumberMaxlength: function () {
        $(document).on('input.inputnumbermaxlength', '[type=number][maxlength]', function (e) {
            var maxLength = this.maxLength || 0;
            if (!maxLength) {
                return;
            }
            this.value = this.value.substr(0, maxLength);
        });
    }
};

// 초기작업 실행
site.init();

// 페이지가 브라우저에 의해 캐시되었는지 여부에 체크하여 새로고침을 해준다.
window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload();
    }
};
