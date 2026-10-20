
    (function() {
      var preconnectOrigins = ["https://cdn.shopify.com","https://extensions.shopifycdn.com"];
      var scripts = ["/cdn/shopifycloud/checkout-web/assets/c1/polyfills.DsjDEvpF.js","/cdn/shopifycloud/checkout-web/assets/c1/app.DGSHpWaV.js","/cdn/shopifycloud/checkout-web/assets/c1/2c1ab0fe.GMbxnz74.js","/cdn/shopifycloud/checkout-web/assets/c1/6a2fc6d6.CB7WRe6i.js","/cdn/shopifycloud/checkout-web/assets/c1/4c290a1e.DMQ9xOwP.js","/cdn/shopifycloud/checkout-web/assets/c1/bb728e1c.CHt2JlPY.js","/cdn/shopifycloud/checkout-web/assets/c1/cf29e63b.BYllFEI4.js","/cdn/shopifycloud/checkout-web/assets/c1/cb38e5c2.Hmwo5zs2.js","/cdn/shopifycloud/checkout-web/assets/c1/413b21e2.DZZRDa_s.js","/cdn/shopifycloud/checkout-web/assets/c1/e477f96c.DJuIaq7S.js","/cdn/shopifycloud/checkout-web/assets/c1/2255f8fa.CDyfBNrW.js","/cdn/shopifycloud/checkout-web/assets/c1/b8733b27.05ur1szn.js","/cdn/shopifycloud/checkout-web/assets/c1/e39bc11c.D2a9UHbt.js","/cdn/shopifycloud/checkout-web/assets/c1/08a3b809.DDk5v8y8.js","/cdn/shopifycloud/checkout-web/assets/c1/bff2ff9b.Cy_si-5k.js","/cdn/shopifycloud/checkout-web/assets/c1/5fda1420.BLaDhoyL.js","/cdn/shopifycloud/checkout-web/assets/c1/164ad2e3.B4L1MRYB.js","/cdn/shopifycloud/checkout-web/assets/c1/9f047e05.DwjCPgK0.js","/cdn/shopifycloud/checkout-web/assets/c1/0a7dffce.BcNpdEJk.js","/cdn/shopifycloud/checkout-web/assets/c1/60a453ce.Cg9T1Gj2.js","/cdn/shopifycloud/checkout-web/assets/c1/21cc90a2.Ccyorzx_.js","/cdn/shopifycloud/checkout-web/assets/c1/f4abf1ad.COUyEES0.js","/cdn/shopifycloud/checkout-web/assets/c1/17324a0b.DrlNqbYZ.js","/cdn/shopifycloud/checkout-web/assets/c1/31cc568e.CVMsqQ1x.js","/cdn/shopifycloud/checkout-web/assets/c1/74835653.DeaMa2xw.js","/cdn/shopifycloud/checkout-web/assets/c1/29034f35.DARWjbfB.js","/cdn/shopifycloud/checkout-web/assets/c1/ac5a19ff.BchXgW63.js","/cdn/shopifycloud/checkout-web/assets/c1/47b970b2.C6dKnXeF.js","/cdn/shopifycloud/checkout-web/assets/c1/0727407f.DihGPUji.js","/cdn/shopifycloud/checkout-web/assets/c1/064f6ac1.DPGuEQ9h.js","/cdn/shopifycloud/checkout-web/assets/c1/53bbdad9.oGVvLPt2.js","/cdn/shopifycloud/checkout-web/assets/c1/efa0389a.ZcaEqvMP.js","/cdn/shopifycloud/checkout-web/assets/c1/a535174a.DPVRr5eA.js","/cdn/shopifycloud/checkout-web/assets/c1/5fd968f2.BwKCnifP.js","/cdn/shopifycloud/checkout-web/assets/c1/01973ac7.hFyCq2Rp.js","/cdn/shopifycloud/checkout-web/assets/c1/58314944.D85q6ENI.js","/cdn/shopifycloud/checkout-web/assets/c1/dffdfb34.5SAJ7sQR.js","/cdn/shopifycloud/checkout-web/assets/c1/0c0ad074.Dl7fvU-G.js","/cdn/shopifycloud/checkout-web/assets/c1/945a08d6.c61SBjtG.js","/cdn/shopifycloud/checkout-web/assets/c1/2fdb3dd3.DyNzUnPi.js","/cdn/shopifycloud/checkout-web/assets/c1/0e67bd3b.DUa61rto.js","/cdn/shopifycloud/checkout-web/assets/c1/f1968089.lfvhhPdb.js","/cdn/shopifycloud/checkout-web/assets/c1/55098bf1.SNyaSeYe.js","/cdn/shopifycloud/checkout-web/assets/c1/cb5cf153.CBk88ZOK.js","/cdn/shopifycloud/checkout-web/assets/c1/e3e348f2.DAaElZ9-.js","/cdn/shopifycloud/checkout-web/assets/c1/ca5e9c49.DIuWAPOX.js","/cdn/shopifycloud/checkout-web/assets/c1/ed9f2238.BDG257lM.js","/cdn/shopifycloud/checkout-web/assets/c1/ccdf3592.y_I-TghG.js","/cdn/shopifycloud/checkout-web/assets/c1/a422df8c.B9fLTQ4u.js","/cdn/shopifycloud/checkout-web/assets/c1/79974aab.DPBsbYrf.js","/cdn/shopifycloud/checkout-web/assets/c1/7b0c98ea.B54fWMkZ.js","/cdn/shopifycloud/checkout-web/assets/c1/d22d2b80.CPLrR--0.js","/cdn/shopifycloud/checkout-web/assets/c1/f49d4216.C2ooXZfg.js","/cdn/shopifycloud/checkout-web/assets/c1/f692f62f.DHgy7Fzw.js","/cdn/shopifycloud/checkout-web/assets/c1/4b77f49a.C1s0kVMd.js","/cdn/shopifycloud/checkout-web/assets/c1/66338e00.BFkksh37.js","/cdn/shopifycloud/checkout-web/assets/c1/9c384ce8.CFjjgE6K.js","/cdn/shopifycloud/checkout-web/assets/c1/24fcbaf6.OQPWDlzZ.js","/cdn/shopifycloud/checkout-web/assets/c1/49758c58.DGQ9DXva.js","/cdn/shopifycloud/checkout-web/assets/c1/28ac86c0.52eUFLJ9.js","/cdn/shopifycloud/checkout-web/assets/c1/3e6029dd.B7hwoFu9.js","/cdn/shopifycloud/checkout-web/assets/c1/30074413.D6ocfG5D.js","/cdn/shopifycloud/checkout-web/assets/c1/9f57d2aa.FdiYumpp.js","/cdn/shopifycloud/checkout-web/assets/c1/8574876b.DlqSeZRL.js","/cdn/shopifycloud/checkout-web/assets/c1/598fef4e.Blg5kMTg.js","/cdn/shopifycloud/checkout-web/assets/c1/33d2e4fc.99-2I_X4.js","/cdn/shopifycloud/checkout-web/assets/c1/39921a74.BMGPgeDG.js","/cdn/shopifycloud/checkout-web/assets/c1/27f09e31.DahwbqDd.js","/cdn/shopifycloud/checkout-web/assets/c1/137622f3.BPoTw3JS.js","/cdn/shopifycloud/checkout-web/assets/c1/54bf0ebb.SmHxAfrv.js","/cdn/shopifycloud/checkout-web/assets/c1/1ed8f5e3.DkmKdCgD.js","/cdn/shopifycloud/checkout-web/assets/c1/c610ba76.uN4RNIMY.js","/cdn/shopifycloud/checkout-web/assets/c1/2210eadb.DF0gIp_2.js","/cdn/shopifycloud/checkout-web/assets/c1/33682ee7.uUOypxz7.js","/cdn/shopifycloud/checkout-web/assets/c1/sandbox.DNKTFXG1.worker.js","/cdn/shopifycloud/checkout-web/assets/c1/sandbox-2025-07.BNlrLTFV.worker.js","https://extensions.shopifycdn.com/shopifycloud/checkout-web/assets/c1/polyfills-entry-modern.70q66_NX.worker.js"];
      var styles = ["/cdn/shopifycloud/checkout-web/assets/c1/assets/app.BuSMBobh.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/previous.Cyrg41An.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/helpers.CWAfD7H_.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/index.CiYh36Pk.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/BillingAddressForm.2HXntA0X.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Captcha.CJQgLR0i.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/VatNumberValidationField.DFhaUJdw.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Choice.CIaVEvsx.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RedirectionNotice.B8v_QGNW.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/EmptyState.CZwDb_Yh.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PhoneField.-WW1pYgW.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Popover.Bi1nHaU-.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/useShopPayButtonClassName.Lp0gX49z.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/TransitionHeight.CuRoM9zv.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/RuntimeExtension.DWkDBM73.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/AnnouncementRuntimeExtensions.54OByf3e.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/QRCode.XhNv4hkB.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Pressable.D9SfDfsb.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/DateField.BkE3n11i.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/PaymentIcon.DUuFvlux.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/NumberField.C0qMELBD.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Switch.CxvbvO76.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/Sheet.CVSBHI9d.css","/cdn/shopifycloud/checkout-web/assets/c1/assets/floating-layer.DfWUBaTh.css"];
      var fontPreconnectUrls = ["https://fonts.shopifycdn.com"];
      var fontPrefetchUrls = ["https://fonts.shopifycdn.com/roboto/roboto_n4.2019d890f07b1852f56ce63ba45b2db45d852cba.woff2?h1=Y2ljYXRyaWJlbS5jb20uYnI&hmac=7978b132814ef998d3c55f34bd71e79255eff395ce4313c598c403df209982f6","https://fonts.shopifycdn.com/roboto/roboto_n5.250d51708d76acbac296b0e21ede8f81de4e37aa.woff2?h1=Y2ljYXRyaWJlbS5jb20uYnI&hmac=1562d835be3e7a7f913615fae112afe91c1c6e5f42644ab08df0b67a8a118889"];
      var imgPrefetchUrls = ["https://cdn.shopify.com/s/files/1/0851/7972/8193/files/LogoSite_x320.png?v=1710438685"];

      function preconnect(url, callback) {
        var link = document.createElement('link');
        link.rel = 'dns-prefetch preconnect';
        link.href = url;
        link.crossOrigin = '';
        link.onload = link.onerror = callback;
        document.head.appendChild(link);
      }

      function preconnectAssets() {
        var resources = preconnectOrigins.concat(fontPreconnectUrls);
        var index = 0;
        (function next() {
          var res = resources[index++];
          if (res) preconnect(res, next);
        })();
      }

      function prefetch(url, as, callback) {
        var link = document.createElement('link');
        if (link.relList.supports('prefetch')) {
          link.rel = 'prefetch';
          link.fetchPriority = 'low';
          link.as = as;
          if (as === 'font') link.type = 'font/woff2';
          link.href = url;
          link.crossOrigin = '';
          link.onload = link.onerror = callback;
          document.head.appendChild(link);
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, true);
          xhr.onloadend = callback;
          xhr.send();
        }
      }

      function prefetchAssets() {
        var resources = [].concat(
          scripts.map(function(url) { return [url, 'script']; }),
          styles.map(function(url) { return [url, 'style']; }),
          fontPrefetchUrls.map(function(url) { return [url, 'font']; }),
          imgPrefetchUrls.map(function(url) { return [url, 'image']; })
        );
        var index = 0;
        function run() {
          var res = resources[index++];
          if (res) prefetch(res[0], res[1], next);
        }
        var next = (self.requestIdleCallback || setTimeout).bind(self, run);
        next();
      }

      function onLoaded() {
        try {
          if (parseFloat(navigator.connection.effectiveType) > 2 && !navigator.connection.saveData) {
            preconnectAssets();
            prefetchAssets();
          }
        } catch (e) {}
      }

      if (document.readyState === 'complete') {
        onLoaded();
      } else {
        addEventListener('load', onLoaded);
      }
    })();
  