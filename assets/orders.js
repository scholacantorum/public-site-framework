window.addEventListener('load', function () {

    var subs = document.getElementsByClassName('buy-subscriptions');
    for (var i = 0; i < subs.length; i++) {
        var s = subs[i];
        s.addEventListener('click', function () {
            scholaGetPayment({
                price: parseInt(s.getAttribute('data-price')),
                title: 'Subscription Order',
                description: s.getAttribute('data-desc'),
                noun: ['Subscription', 'Subscriptions'],
                coupons: {},
                product: s.getAttribute('data-product'),
            });
        });
    }

    var tix = document.getElementsByClassName('buy-tickets');
    for (var i = 0; i < tix.length; i++) {
        var t = tix[i];
        t.addEventListener('click', function () {
            var coupons = {};
            for (var j = 1; ; j++) {
                var code = t.getAttribute('data-coupon' + j);
                if (!code) break;
                var price = t.getAttribute('data-cprice' + j);
                coupons[code] = parseInt(price);
            }
            scholaGetPayment({
                price: parseInt(t.getAttribute('data-price')),
                title: 'Ticket Order',
                description: t.getAttribute('data-desc'),
                noun: ['Ticket', 'Tickets'],
                coupons: coupons,
                product: t.getAttribute('data-product'),
            });
        });
    }

    var donationform = document.getElementById('donationform');
    if (!donationform) return;
    scholaUpdateOrderHook = function () {
        var amount = parseInt(donationform.amount.value);
        if (isNaN(amount) || amount < 1) return null;
        return {
            title: 'Tax-Deductible Donation',
            donate: amount,
        }
    }
    scholaPaymentAcceptedHook = function () {
        donationform.innerHTML = '<div id="donationconfirm">Thank you for your donation!</div>';
    }
    donationform.addEventListener('submit', function (evt) {
        evt.preventDefault();
        var amount = parseInt(donationform.amount.value);
        if (isNaN(amount) || amount < 1) return;
        scholaGetPayment({
            donate: amount,
            title: 'Tax-Deductible Donation',
            description: 'Thank you for supporting Schola Cantorum!',
        });
    });
});
