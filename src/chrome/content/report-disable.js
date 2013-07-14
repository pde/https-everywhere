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

VERB=1;
DBUG=2;
INFO=3;
NOTE=4;
WARN=5;

CC = Components.classes;
CI = Components.interfaces;

HTTPSEverywhere = CC["@eff.org/https-everywhere;1"]
                      .getService(Components.interfaces.nsISupports)
                      .wrappedJSObject;


if (!httpsEverywhere) { var httpsEverywhere = {}; }

/**
 * JS Object for reporting disabled rulesets.
 *
 * @author Yan Zhu <yan@mit.edu>
 */

httpsEverywhere.reportRule = {
 
  TIMEOUT: 60000,
  prefs: HTTPSEverywhere.get_prefs(),
  submit_host: httpsEverywhere.reportRule.prefs.getCharPref("report_host"),
 
  init: function() {
    var rr = httpsEverywhere.reportRule;
    if("arguments" in window && window.arguments.length > 0) {
      // rewrite this since var declarations get executed anyway
      var rulename = window.arguments[0].xmlName;
      var id = window.arguments[0].GITCommitID; //GIT commit ID
    } else {
      // Should never happen
      throw 'Invalid window arguments.';
    }
    rr.submitReport(rulename,id)
  },

  submitReport: function(rulename, commit_id) {
    var rr = httpsEverywhere.reportRule;
    var reqParams = [];
    reqParams.push("rulename="+rulename);
    reqParams.push("commit_id"=+commit_id);
    //TODO: add httpse version, browser
    HTTPSEverywhere.log(INFO, "Submitting report for "+rulename);
    HTTPSEverywhere.log(DEBUG, "submitReport params: "+params);
    var params = reqParams.join("&");
    var req = rr.buildRequest(params);
    req.timeout = rr.TIMEOUT;
    req.onreadystatechange = function(params) {
      if (req.readyState == 4) {
        // HTTP Request was successful
        if (req.status == 200) {
          HTTPSEverywhere.log(INFO, "Submission successful: "+rulename);
        } else {
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
    var submit_url = "https://" + rr.submit_host + "/submit_report/submit.py";
    req.open("POST", submit_url, true);
    return req;
  },

  /**
   * Handle a submit ruleset failure.
   */
  submitFailed: function() {
    HTTPSEverywhere.log(WARN, "submit failed")
  },
};


