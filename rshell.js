// Based on old "lolshell" project

// Some useful functions (and vars)
var f = {
	// thx to Scott Andrew
	addEvent: function (obj, evType, fn) { 
		if (obj.addEventListener){ 
			obj.addEventListener (evType, fn, false); 
			return true; 
		} else if (obj.attachEvent){ 
			var r = obj.attachEvent ("on" + evType, fn); 
			return r; 
		} else { 
			eval ("obj.on" + evType + " = fn;");
		} 
	},
	
	checkBrowser: function () {
		if (!document.getElementById || !document.createElement || !$) return f.error ("Your browser is too old (no getElementById || createElement) or you haven't loaded jQuery. <a href='http://getfirefox.com'>Get Firefox</a> or a new copy of rShell :P.");
		return true;
	},
	
	error: function (string) {
		$("body").html ("<div class='error' style='text-align:center;font-family:monospace;font-size:15px;color:#ff0011;'>Error: " + string + "</div>");
		return false;
	},
};

/* configvars must be an associative array with the following vars:
 * - ps1
 * - placeIn (*form* object where I should place rShell.)
 * - defaultPath
 * - defaultUser
 * - mcharlength (maximum length for the inputbox, null if you want to use default value)
 * - initmsg (message that appears on the shell when initialized)
 */
function rShell (configvars) {
	if (!f.checkBrowser()) {
		this.printShell = function() {};
		return false;
	}
	var requiredObjects = ["ps1", "placein", "defaultpath", "defaultuser", "mcharlength", "initmsg"];
	for (i in requiredObjects) {
		var ro = requiredObjects [i];
		if (typeof (configvars[ro]) === "undefined") return f.error ("You should add '"+requiredObjects[i]+"' in configvars");
	}
	this.conf = configvars;
	if (!this.conf.mcharlength)
		this.conf.mcharlength = 71;
	this.h_commands = {};
	this.path = this.conf.defaultpath;
	this.user = this.conf.defaultuser;
	this.oldpath = null;
	this.olduser = null;
	this.lastcmd = null;
}

rShell.prototype = {
	printShell: function () {
		var maindiv = document.createElement ("div"); // Container
		var inputbox= document.createElement ("input"); // Inputbox
		var cmdspace= document.createElement ("div");  // Command container (for history, I mean)
		var ps1span = document.createElement ("span"); // PS1 Container
		maindiv.setAttribute ("id", "r_div");
		cmdspace.setAttribute ("id", "r_cmdspace");
		ps1span.setAttribute ("id", "r_ps1");
		this.conf.placein.append (maindiv); // jQuery object
		maindiv = $("#r_div");
		maindiv.append (this.conf.initmsg + "<br /><br />");
		inputbox.setAttribute ("type", "text");
		inputbox.setAttribute ("id"  , "r_input");
		inputbox.setAttribute ("autocomplete", "off");
		inputbox.style.width = "520px";
		maindiv.append (cmdspace);
		maindiv.append (ps1span);
		ps1span = $("#r_ps1");
		ps1span.append (this.getPs1 (this.conf.defaultpath, this.conf.defaultuser, 1));
		maindiv.append (inputbox);
		inputbox.focus ();
		f.addEvent (window, "click", function () { $("#r_input").focus(); });
	},

	hookCommand: function (command, callback) {
		if (!this.h_commands) return;
		this.h_commands[command] = callback; 
	},

	parseCommand: function () {
		var cmd = $("#r_input").val();
		// Save current path and current user var (for writeResult function)
		this.oldpath = this.path;
		this.olduser = this.user;
		// Split command by spaces so to get command itself and his parameters
		var tmp_split = cmd.split (/ /);
		var yay = 0; // alias = found
		cmd = this.fixStr (tmp_split.shift ());
		// Save command in lastcmd for writeResult
		this.lastcmd = cmd + ( tmp_split.length >= 1 ? " " + this.fixStr (tmp_split.join (" ")) : "" );
		if (!cmd) {
			this.writeResult ("", 1);
			return false;
		}
		// tmp_split is now splitted and has only the params
		if (typeof (this.h_commands [cmd]) === "function" && !yay) {
			// just call callback (:P)
			this.h_commands [cmd] (cmd, tmp_split, this);
			yay = 1;
		}
		if (!yay) this.writeResult ("rShell: " + this.lastcmd + ": command not found");
		$("#r_input").val ("");
		$("#r_input").focus();
		var pos = $("#r_input").position();
		$("body").animate ({
			scrollTop: pos.top, 
			scrollLeft: pos.left
		}, 1);
	},
	
	writeResult: function (string, nobr, fixStr) {
		// That will be a great work..
		// [oldlocation] > oldcommand
		// [var string]
		// [normal inputbox with ps1 (updated with new location if there's one)]
		var cmdiv = $("#r_cmdspace");
		cmdiv.append (this.getPs1 (this.oldpath, this.olduser, 1));
		cmdiv.append (this.lastcmd + (nobr ? "" : "<br />"));
		cmdiv.append ((fixStr ? this.fixStr (string) : string) + "<br />");
		$("#r_ps1").html (this.getPs1 (this.path, this.user, 1));
	},
	
	chpath: function (path) {
		this.oldpath = this.path;
		this.path    = path;
	},
	
	chuser: function (newuser) {
		this.olduser = this.user;
		this.user    = newuser;
	},
	
	getPs1: function (location, user, wspace) {
		return this.conf.ps1.replace (/\{path\}/i, location).replace (/\{user\}/i, user) + (wspace ? "&nbsp;" : "");
	},

	fixStr: function (str) {
		return str.replace (/</g, "&lt;").replace (/>/g, "&gt;");
	}
};
