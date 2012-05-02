(function ($) {
    window.Storer = initStorer(function (Storer) {
        var memoryStorage  = Storer.memoryStorage,
            cookieStorage  = Storer.cookieStorage,
            sessionStorage = Storer.sessionStorage,
            localStorage   = Storer.localStorage;

        jQuery(document).ready(function ($) {
            $('#demos').find('.btn').click(function () {
                var result, scr = $(this).prev('pre').text();
                try {
                    result = eval("(function () {\n" + scr + "\n}())");
                } catch (e) {}
                $(this).parent().prev('input').val(scr.indexOf('return') === -1 ? '' : typeof result + ': ' + result);
            });
        });
    }, { prefix: 'StorerDemo' });

    $(document).ready(function () {
        prettyPrint();

        var headings = [];

        var collectHeaders = function () {
            headings.push({"top":$(this).offset().top - 15, "text":$(this).text()});
        }

        if ($(".markdown-body h1").length > 1) $(".markdown-body h1").each(collectHeaders)
        else if ($(".markdown-body h2").length > 1) $(".markdown-body h2").each(collectHeaders)
        else if ($(".markdown-body h3").length > 1) $(".markdown-body h3").each(collectHeaders)

        $(window).scroll(function () {
            if (headings.length == 0) return true;
            var scrolltop = $(window).scrollTop() || 0;
            if (headings[0] && scrolltop < headings[0].top) {
                $(".current-section").css({"opacity":0, "visibility":"hidden"});
                return false;
            }
            $(".current-section").css({"opacity":1, "visibility":"visible"});
            for (var i in headings) {
                if (scrolltop >= headings[i].top) {
                    $(".current-section .name").text(headings[i].text);
                }
            }
        });

        $(".current-section a").click(function () {
            $(window).scrollTop(0);
            return false;
        })
    });
}(jQuery));