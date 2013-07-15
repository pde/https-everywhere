/* vim: set expandtab tabstop=2 shiftwidth=2 softtabstop=2 foldmethod=marker: */

/**
 * HTTPS Everywhere Firefox Extension: https://www.eff.org/https-everywhere/
 *
 * Licensed under the GPL v3+.
 * 
 * @copyright Copyright (C) 2010-2013 Mike Perry <mikeperry@fscked.org> 
 *                                    Peter Eckersley <pde@eff.org>
 *                                    and many others.
 */

// Define https everywhere variable object that will act as a namespace, so that 
// global namespace pollution is avoided, although technically not required for
// windows created by add-on.
// See: https://developer.mozilla.org/en-US/docs/Security_best_practices_in_extensions#Code_wrapping
var VERB=1;
var DBUG=2;
var INFO=3;
var NOTE=4;
var WARN=5;

var CC = Components.classes;
var CI = Components.interfaces;

var HTTPSEverywhere = CC["@eff.org/https-everywhere;1"]
                      .getService(Components.interfaces.nsISupports)
                      .wrappedJSObject;

if (!httpsEverywhere) { var httpsEverywhere = {}; };
/**
 * JS Object for reporting disabled rulesets.
 *
 * @author Yan Zhu <yan@mit.edu>
 */

httpsEverywhere.reportRule = {
 
  TIMEOUT: 60000,
  prefs: HTTPSEverywhere.get_prefs(),

  init: function() {
    var rr = httpsEverywhere.reportRule;
    // get arguments for submitReport from window if necessary
    if("arguments" in window && window.arguments.length > 0) {
      var rulename = window.arguments[0].xmlName;
      var id = window.arguments[0].GITCommitID; //GIT commit ID
      var comment = document.getElementById("comment").value;
    } else {
      // Should never happen
      throw 'Invalid window arguments.';
    }
    rr.submitReport(rulename,id,comment);
  },

  getSysInfo: function(params) {
    // https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous#System_info
    try {
      var osString = CC["@mozilla.org/xre/app-info;1"]
                        .getService(CI.nsIXULRuntime).OS;
    } catch (ex) {
    // needed for Seamonkey 2.0
      var osString = CC["@mozilla.org/network/protocol;1?name=http"]
                         .getService(CI.nsIHttpProtocolHandler).oscpu;
    }
    params.push("os="+osString);
    var appInfo = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo);
    params.push("app_name="+appInfo.name); // ex: firefox
    params.push("app_version="+appInfo.version); // ex: 2.0.0.1
    var req_len = params.length+1; //awkward way to know when async call is done
    try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("https-everywhere@eff.org", function(addon) {
        params.push("ext_version="+addon.version);
      });
    } catch (ex) {
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      var em = CC["@mozilla.org/extensions/manager;1"].getService(CI.nsIExtensionManager);
      var addon = em.getItemForID("https-everywhere@eff.org");
      params.push("ext_version="+addon.version);
    }
    while (params.length < req_len) {
      continue;
   //   if (params.length == req_len) {
   //     break;
   //   }
    }
  },

  waitForParams: function(params, callback) {
    var rr = httpsEverywhere.reportRule;
    function gotParams() {
      callback(params);
    }
    setTimeout(gotParams, 3000);
  },

  submitReport: function(rulename, commit_id, comment) {
    var rr = httpsEverywhere.reportRule;
    var reqParams = [];
    reqParams.push("rulename="+rulename);
    reqParams.push("commit_id="+commit_id);
    reqParams.push("comment="+comment);
    //rr.getSysInfo(reqParams);
    //var params = reqParams.join("&");
    rr.waitForParams(reqParams, rr.getSysInfo);
    params = reqParams.join("&");
    var req = rr.buildRequest(params);
    HTTPSEverywhere.log(INFO, "Submitting report for "+rulename);
    HTTPSEverywhere.log(DBUG, "submitReport params: "+params);
    req.timeout = rr.TIMEOUT;
    req.onreadystatechange = function(params) {
      if (req.readyState == 4) {
        // HTTP Request was successful
        if (req.status == 200) {
          HTTPSEverywhere.log(INFO, "Submission successful: "+rulename);
        } else {
          HTTPSEverywhere.log(DBUG, "HTTP request status: "+req.status);
          // at least we tried...
          rr.submitFailed();
        }
      }
    };
    req.send(params);
  },

  buildRequest: function(params) {
    var rr = httpsEverywhere.reportRule;
    var req = CC["@mozilla.org/xmlextras/xmlhttprequest;1"]
                 .createInstance(CI.nsIXMLHttpRequest);
    var submit_host = rr.prefs.getCharPref("report_host");
    var submit_url = "https://"+submit_host+"/submit_report/submit.py";
    HTTPSEverywhere.log(DBUG, "report submission URL: "+submit_url);
    req.open("POST", submit_url, true);
    //send proper header info
    req.setRequestHeader("X-Privacy-Info", "EFF SSL Observatory: https://eff.org/r.22c");
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Content-length", params.length);
    req.setRequestHeader("Connection", "close");
    // clear headers for privacy
    req.setRequestHeader("User-Agent", "");
    req.setRequestHeader("Accept", "");
    req.setRequestHeader("Accept-Encoding", "");
    req.setRequestHeader("Accept-Charset", "");
    return req;
  },

  /**
   * Handle a submit ruleset failure.
   */
  submitFailed: function() {
    HTTPSEverywhere.log(WARN, "submit failed");
  },

  setFilenameText: function () {
    var rulename = window.arguments[0].xmlName;
    var comment_label = document.getElementById("comment-label");
    comment_label.value += rulename;
  },
};

window.addEventListener("load", httpsEverywhere.reportRule.setFilenameText, false);
