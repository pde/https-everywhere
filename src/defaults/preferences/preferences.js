pref("extensions.https_everywhere.LogLevel", 2); //verbose for debugging 
pref("extensions.https_everywhere.globalEnabled",true);

// report_disabled_rules must be true for any prompts to be displayed
// if report_disabled_rules_tor_only is true, only show prompts
// when tor is enabled
pref("extensions.https_everywhere.report_disabled_rules", true);
pref("extensions.https_everywhere.report_disabled_rules_tor_only", false);
pref("extensions.https_everywhere.report_host", "zyan.scripts.mit.edu");

// optional system info to send along with the name of disabled rule
pref("extensions.https_everywhere.report_browser", false);
pref("extensions.https_everywhere.report_addon_version", true);
pref("extensions.https_everywhere.report_os", false);

// SSl Observatory preferences
pref("extensions.https_everywhere._observatory.enabled",false);

// "testing" currently means send unecessary fingerprints and other test-suite
// type stuff
pref("extensions.https_everywhere._observatory.testing",false);

pref("extensions.https_everywhere._observatory.server_host","observatory.eff.org");
pref("extensions.https_everywhere._observatory.use_tor_proxy",true);
pref("extensions.https_everywhere._observatory.submit_during_tor",true);
pref("extensions.https_everywhere._observatory.submit_during_nontor",true);

pref("extensions.https_everywhere._observatory.cache_submitted",true);

pref("extensions.https_everywhere._observatory.use_custom_proxy",false);
pref("extensions.https_everywhere._observatory.popup_shown",false);
pref("extensions.https_everywhere._observatory.proxy_host","");
pref("extensions.https_everywhere._observatory.proxy_port",0);
pref("extensions.https_everywhere._observatory.proxy_type","direct");
pref("extensions.https_everywhere._observatory.alt_roots",false);
pref("extensions.https_everywhere._observatory.self_signed",true);
pref("extensions.https_everywhere._observatory.priv_dns",false);
pref("extensions.https_everywhere._observatory.send_asn",true);
pref("extensions.https_everywhere._observatory.use_whitelist",true);
