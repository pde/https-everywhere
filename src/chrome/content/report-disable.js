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
const VERB=1;
const DBUG=2;
const INFO=3;
const NOTE=4;
const WARN=5;

const CC = Components.classes;
const CI = Components.interfaces;

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

  getSysInfoSync: function(p) {
    // https://developer.mozilla.org/en-US/docs/Code_snippets/Miscellaneous#System_info
    try {
      var osString = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULRuntime).OS;
    } catch (ex) {
    // needed for Seamonkey 2.0
      var osString = CC["@mozilla.org/network/protocol;1?name=http"]
                         .getService(CI.nsIHttpProtocolHandler).oscpu;
    }
    p.push("os="+osString);
    var appInfo = CC["@mozilla.org/xre/app-info;1"].getService(CI.nsIXULAppInfo);
    p.push("app_name="+appInfo.name); // ex: firefox
    p.push("app_version="+appInfo.version); // ex: 2.0.0.1
  },

  getSysInfoAsync: function(p) {
    // this is a separate function, awkwardly, because getAddonByID is asynchronous.
    // since we need to wait for it to return before the POST request can be submitted,
    // we give it finishRequest as a callback.
    var rr = httpsEverywhere.reportRule;
    try {
      // Firefox 4 and later; Mozilla 2 and later
      Components.utils.import("resource://gre/modules/AddonManager.jsm");
      AddonManager.getAddonByID("https-everywhere@eff.org", function(addon) {
        p.push("ext_version="+addon.version);
        rr.finishRequest(p);
      });
    } catch (ex) {
      HTTPSEverywhere.log(WARN, ex);
      // Firefox 3.6 and before; Mozilla 1.9.2 and before
      var em = CC["@mozilla.org/extensions/manager;1"].getService(CI.nsIExtensionManager);
      var addon = em.getItemForID("https-everywhere@eff.org");
      p.push("ext_version="+addon.version);
      rr.finishRequest(p);
    }
  },
  
  finishRequest: function(p) {
    var rr = httpsEverywhere.reportRule;
    var params = p.join("&");
    var req = rr.buildRequest(params);
    HTTPSEverywhere.log(INFO, "submitting bug report with POST params: "+params);
    req.timeout = rr.TIMEOUT;
    req.onreadystatechange = function(params) {
      if (req.readyState == 4) {
        // HTTP Request was successful
        if (req.status == 200) {
          HTTPSEverywhere.log(INFO, "Submission successful");
        } else {
          HTTPSEverywhere.log(DBUG, "HTTP request status: "+req.status);
          // at least we tried...
          rr.submitFailed();
        }
      }
    };
    req.send(params); 
  },

  submitReport: function(rulename, commit_id, comment) {
    var rr = httpsEverywhere.reportRule;
    var reqParams = [];
    reqParams.push("rulename="+rulename);
    reqParams.push("commit_id="+commit_id);
    reqParams.push("comment="+comment);
    rr.getSysInfoSync(reqParams);
    rr.getSysInfoAsync(reqParams);
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
    HTTPSEverywhere.log(INFO, "submit failed");
  },

  setFilenameText: function() {
      var rulename = window.arguments[0].xmlName;
      var dialog_header = document.getElementById("dialog-header");
      dialog_header.setAttribute("title", dialog_header.getAttribute("title")+rulename);
  },

  disable: function() {
    httpsEverywhere.reportRule.prefs.setBoolPref("report_disabled_rules", false);
  },

  enable: function() {
    httpsEverywhere.reportRule.prefs.setBoolPref("report_disabled_rules", true);
  },

  toggle: function() {
    var rr = httpsEverywhere.reportRule;
    var report = rr.prefs.getBoolPref("report_disabled_rules");
    if (report) {
      rr.disable();
    } else {
      rr.enable();
    }
  },

  toggleTor: function() {
    var rr = httpsEverywhere.reportRule;
    var report_tor = rr.prefs.getBoolPref("report_disabled_rules_tor_only");
    if (report_tor) {
      rr.disableTorOnly();
    } else {
      rr.enable();
      rr.enableTorOnly();
    }
  },

  checkboxTor: function() {
    var rr = httpsEverywhere.reportRule;
    var torbox = document.getElementById("tor-ask");
    if (rr.prefs.getBoolPref("report_disabled_rules_tor_only")) {
      torbox.setAttribute("checked", "true");
    }
  },

  enableTorOnly: function() {
    httpsEverywhere.reportRule.prefs.setBoolPref("report_disabled_rules_tor_only", true);
  },

  disableTorOnly: function() {
    httpsEverywhere.reportRule.prefs.setBoolPref("report_disabled_rules_tor_only", false);
  },

  showHelper: function() {
    var helper_text = document.getElementById("helper-text");
    helper_text.setAttribute("hidden", "false");
  },

  onDisableCheck: function() {
    var rr = httpsEverywhere.reportRule;
    rr.toggle();
    rr.showHelper();
    if (document.getElementById("tor-ask").getAttribute("checked", "true")) { 
      // don't let both boxes be checked at once
      document.getElementById("tor-ask").setAttribute("checked", "false");
      rr.disableTorOnly;
    }
  },

  onTorCheck: function() {
    var rr = httpsEverywhere.reportRule;
    rr.toggleTor();
    rr.showHelper();
    if (document.getElementById("dont-ask").getAttribute("checked", "true")) {
      document.getElementById("dont-ask").setAttribute("checked", "false");
      rr.enable;
    }
  }
};
     
window.addEventListener("load", httpsEverywhere.reportRule.setFilenameText, false);
window.addEventListener("load", httpsEverywhere.reportRule.checkboxTor, false);
