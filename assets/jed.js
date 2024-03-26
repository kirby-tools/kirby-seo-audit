/**
 * @preserve jed.js https://github.com/SlexAxton/Jed
 */
var C = Array.prototype, G = Object.prototype, M = C.slice, z = G.hasOwnProperty, I = C.forEach, U = {}, N = {
  forEach: function(t, n, l) {
    var r, i, s;
    if (t !== null) {
      if (I && t.forEach === I)
        t.forEach(n, l);
      else if (t.length === +t.length) {
        for (r = 0, i = t.length; r < i; r++)
          if (r in t && n.call(l, t[r], r, t) === U)
            return;
      } else
        for (s in t)
          if (z.call(t, s) && n.call(l, t[s], s, t) === U)
            return;
    }
  },
  extend: function(t) {
    return this.forEach(M.call(arguments, 1), function(n) {
      for (var l in n)
        t[l] = n[l];
    }), t;
  }
}, a = function(t) {
  if (this.defaults = {
    locale_data: {
      messages: {
        "": {
          domain: "messages",
          lang: "en",
          plural_forms: "nplurals=2; plural=(n != 1);"
        }
        // There are no default keys, though
      }
    },
    // The default domain if one is missing
    domain: "messages",
    // enable debug mode to log untranslated strings to the console
    debug: !1
  }, this.options = N.extend({}, this.defaults, t), this.textdomain(this.options.domain), t.domain && !this.options.locale_data[this.options.domain])
    throw new Error(
      "Text domain set to non-existent domain: `" + t.domain + "`"
    );
};
a.context_delimiter = "";
function S(t) {
  return a.PF.compile(t || "nplurals=2; plural=(n != 1);");
}
function L(t, n) {
  this._key = t, this._i18n = n;
}
N.extend(L.prototype, {
  onDomain: function(t) {
    return this._domain = t, this;
  },
  withContext: function(t) {
    return this._context = t, this;
  },
  ifPlural: function(t, n) {
    return this._val = t, this._pkey = n, this;
  },
  fetch: function(t) {
    return {}.toString.call(t) != "[object Array]" && (t = [].slice.call(arguments, 0)), (t && t.length ? a.sprintf : function(n) {
      return n;
    })(
      this._i18n.dcnpgettext(
        this._domain,
        this._context,
        this._key,
        this._pkey,
        this._val
      ),
      t
    );
  }
});
N.extend(a.prototype, {
  // The sexier api start point
  translate: function(t) {
    return new L(t, this);
  },
  textdomain: function(t) {
    if (!t)
      return this._textdomain;
    this._textdomain = t;
  },
  gettext: function(t) {
    return this.dcnpgettext.call(this, void 0, void 0, t);
  },
  dgettext: function(t, n) {
    return this.dcnpgettext.call(this, t, void 0, n);
  },
  dcgettext: function(t, n) {
    return this.dcnpgettext.call(this, t, void 0, n);
  },
  ngettext: function(t, n, l) {
    return this.dcnpgettext.call(this, void 0, void 0, t, n, l);
  },
  dngettext: function(t, n, l, r) {
    return this.dcnpgettext.call(this, t, void 0, n, l, r);
  },
  dcngettext: function(t, n, l, r) {
    return this.dcnpgettext.call(this, t, void 0, n, l, r);
  },
  pgettext: function(t, n) {
    return this.dcnpgettext.call(this, void 0, t, n);
  },
  dpgettext: function(t, n, l) {
    return this.dcnpgettext.call(this, t, n, l);
  },
  dcpgettext: function(t, n, l) {
    return this.dcnpgettext.call(this, t, n, l);
  },
  npgettext: function(t, n, l, r) {
    return this.dcnpgettext.call(this, void 0, t, n, l, r);
  },
  dnpgettext: function(t, n, l, r, i) {
    return this.dcnpgettext.call(this, t, n, l, r, i);
  },
  // The most fully qualified gettext function. It has every option.
  // Since it has every option, we can use it from every other method.
  // This is the bread and butter.
  // Technically there should be one more argument in this function for 'Category',
  // but since we never use it, we might as well not waste the bytes to define it.
  dcnpgettext: function(t, n, l, r, i) {
    r = r || l, t = t || this._textdomain;
    var s;
    if (!this.options)
      return s = new a(), s.dcnpgettext.call(
        s,
        void 0,
        void 0,
        l,
        r,
        i
      );
    if (!this.options.locale_data)
      throw new Error("No locale data provided.");
    if (!this.options.locale_data[t])
      throw new Error("Domain `" + t + "` was not found.");
    if (!this.options.locale_data[t][""])
      throw new Error("No locale meta information provided.");
    if (!l)
      throw new Error("No translation key found.");
    var c = n ? n + a.context_delimiter + l : l, u = this.options.locale_data, e = u[t], f = (u.messages || this.defaults.locale_data.messages)[""], o = e[""].plural_forms || e[""]["Plural-Forms"] || e[""]["plural-forms"] || f.plural_forms || f["Plural-Forms"] || f["plural-forms"], y, h, x;
    if (i === void 0)
      x = 0;
    else {
      if (typeof i != "number" && (i = parseInt(i, 10), isNaN(i)))
        throw new Error("The number that was passed in is not a number.");
      x = S(o)(i);
    }
    if (!e)
      throw new Error("No domain named `" + t + "` could be found.");
    return y = e[c], !y || x > y.length ? (this.options.missing_key_callback && this.options.missing_key_callback(c, t), h = [l, r], this.options.debug === !0 && console.log(h[S(o)(i)]), h[S()(i)]) : (h = y[x], h || (h = [l, r], h[S()(i)]));
  }
});
var O = function() {
  function t(r) {
    return Object.prototype.toString.call(r).slice(8, -1).toLowerCase();
  }
  function n(r, i) {
    for (var s = []; i > 0; s[--i] = r)
      ;
    return s.join("");
  }
  var l = function() {
    return l.cache.hasOwnProperty(arguments[0]) || (l.cache[arguments[0]] = l.parse(arguments[0])), l.format.call(
      null,
      l.cache[arguments[0]],
      arguments
    );
  };
  return l.format = function(r, i) {
    var s = 1, c = r.length, u = "", e, f = [], o, y, h, x, P, w;
    for (o = 0; o < c; o++)
      if (u = t(r[o]), u === "string")
        f.push(r[o]);
      else if (u === "array") {
        if (h = r[o], h[2])
          for (e = i[s], y = 0; y < h[2].length; y++) {
            if (!e.hasOwnProperty(h[2][y]))
              throw O(
                '[sprintf] property "%s" does not exist',
                h[2][y]
              );
            e = e[h[2][y]];
          }
        else
          h[1] ? e = i[h[1]] : e = i[s++];
        if (/[^s]/.test(h[8]) && t(e) != "number")
          throw O(
            "[sprintf] expecting number but found %s",
            t(e)
          );
        switch ((typeof e > "u" || e === null) && (e = ""), h[8]) {
          case "b":
            e = e.toString(2);
            break;
          case "c":
            e = String.fromCharCode(e);
            break;
          case "d":
            e = parseInt(e, 10);
            break;
          case "e":
            e = h[7] ? e.toExponential(h[7]) : e.toExponential();
            break;
          case "f":
            e = h[7] ? parseFloat(e).toFixed(h[7]) : parseFloat(e);
            break;
          case "o":
            e = e.toString(8);
            break;
          case "s":
            e = (e = String(e)) && h[7] ? e.substring(0, h[7]) : e;
            break;
          case "u":
            e = Math.abs(e);
            break;
          case "x":
            e = e.toString(16);
            break;
          case "X":
            e = e.toString(16).toUpperCase();
            break;
        }
        e = /[def]/.test(h[8]) && h[3] && e >= 0 ? "+" + e : e, P = h[4] ? h[4] == "0" ? "0" : h[4].charAt(1) : " ", w = h[6] - String(e).length, x = h[6] ? n(P, w) : "", f.push(h[5] ? e + x : x + e);
      }
    return f.join("");
  }, l.cache = {}, l.parse = function(r) {
    for (var i = r, s = [], c = [], u = 0; i; ) {
      if ((s = /^[^\x25]+/.exec(i)) !== null)
        c.push(s[0]);
      else if ((s = /^\x25{2}/.exec(i)) !== null)
        c.push("%");
      else if ((s = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(
        i
      )) !== null) {
        if (s[2]) {
          u |= 1;
          var e = [], f = s[2], o = [];
          if ((o = /^([a-z_][a-z_\d]*)/i.exec(f)) !== null)
            for (e.push(o[1]); (f = f.substring(
              o[0].length
            )) !== ""; )
              if ((o = /^\.([a-z_][a-z_\d]*)/i.exec(
                f
              )) !== null)
                e.push(o[1]);
              else if ((o = /^\[(\d+)\]/.exec(f)) !== null)
                e.push(o[1]);
              else
                throw "[sprintf] huh?";
          else
            throw "[sprintf] huh?";
          s[2] = e;
        } else
          u |= 2;
        if (u === 3)
          throw "[sprintf] mixing positional and named placeholders is not (yet) supported";
        c.push(s);
      } else
        throw "[sprintf] huh?";
      i = i.substring(s[0].length);
    }
    return c;
  }, l;
}(), Q = function(t, n) {
  return n.unshift(t), O.apply(null, n);
};
a.parse_plural = function(t, n) {
  return t = t.replace(/n/g, n), a.parse_expression(t);
};
a.sprintf = function(t, n) {
  return {}.toString.call(n) == "[object Array]" ? Q(t, [].slice.call(n)) : O.apply(this, [].slice.call(arguments));
};
a.prototype.sprintf = function() {
  return a.sprintf.apply(this, arguments);
};
a.PF = {};
a.PF.parse = function(t) {
  var n = a.PF.extractPluralExpr(t);
  return a.PF.parser.parse.call(a.PF.parser, n);
};
a.PF.compile = function(t) {
  function n(r) {
    return r === !0 ? 1 : r || 0;
  }
  var l = a.PF.parse(t);
  return function(r) {
    return n(a.PF.interpreter(l)(r));
  };
};
a.PF.interpreter = function(t) {
  return function(n) {
    switch (t.type) {
      case "GROUP":
        return a.PF.interpreter(t.expr)(n);
      case "TERNARY":
        return a.PF.interpreter(t.expr)(n) ? a.PF.interpreter(t.truthy)(n) : a.PF.interpreter(t.falsey)(n);
      case "OR":
        return a.PF.interpreter(t.left)(n) || a.PF.interpreter(t.right)(n);
      case "AND":
        return a.PF.interpreter(t.left)(n) && a.PF.interpreter(t.right)(n);
      case "LT":
        return a.PF.interpreter(t.left)(n) < a.PF.interpreter(t.right)(n);
      case "GT":
        return a.PF.interpreter(t.left)(n) > a.PF.interpreter(t.right)(n);
      case "LTE":
        return a.PF.interpreter(t.left)(n) <= a.PF.interpreter(t.right)(n);
      case "GTE":
        return a.PF.interpreter(t.left)(n) >= a.PF.interpreter(t.right)(n);
      case "EQ":
        return a.PF.interpreter(t.left)(n) == a.PF.interpreter(t.right)(n);
      case "NEQ":
        return a.PF.interpreter(t.left)(n) != a.PF.interpreter(t.right)(n);
      case "MOD":
        return a.PF.interpreter(t.left)(n) % a.PF.interpreter(t.right)(n);
      case "VAR":
        return n;
      case "NUM":
        return t.val;
      default:
        throw new Error("Invalid Token found.");
    }
  };
};
a.PF.extractPluralExpr = function(t) {
  t = t.replace(/^\s\s*/, "").replace(/\s\s*$/, ""), /;\s*$/.test(t) || (t = t.concat(";"));
  var n = /nplurals\=(\d+);/, l = /plural\=(.*);/, r = t.match(n), i;
  if (r.length > 1)
    r[1];
  else
    throw new Error("nplurals not found in plural_forms string: " + t);
  if (t = t.replace(n, ""), i = t.match(l), !(i && i.length > 1))
    throw new Error("`plural` expression not found: " + t);
  return i[1];
};
a.PF.parser = function() {
  var t = {
    trace: function() {
    },
    yy: {},
    symbols_: {
      error: 2,
      expressions: 3,
      e: 4,
      EOF: 5,
      "?": 6,
      ":": 7,
      "||": 8,
      "&&": 9,
      "<": 10,
      "<=": 11,
      ">": 12,
      ">=": 13,
      "!=": 14,
      "==": 15,
      "%": 16,
      "(": 17,
      ")": 18,
      n: 19,
      NUMBER: 20,
      $accept: 0,
      $end: 1
    },
    terminals_: {
      2: "error",
      5: "EOF",
      6: "?",
      7: ":",
      8: "||",
      9: "&&",
      10: "<",
      11: "<=",
      12: ">",
      13: ">=",
      14: "!=",
      15: "==",
      16: "%",
      17: "(",
      18: ")",
      19: "n",
      20: "NUMBER"
    },
    productions_: [
      0,
      [3, 2],
      [4, 5],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 3],
      [4, 1],
      [4, 1]
    ],
    performAction: function(r, i, s, c, u, e, f) {
      var o = e.length - 1;
      switch (u) {
        case 1:
          return { type: "GROUP", expr: e[o - 1] };
        case 2:
          this.$ = {
            type: "TERNARY",
            expr: e[o - 4],
            truthy: e[o - 2],
            falsey: e[o]
          };
          break;
        case 3:
          this.$ = { type: "OR", left: e[o - 2], right: e[o] };
          break;
        case 4:
          this.$ = { type: "AND", left: e[o - 2], right: e[o] };
          break;
        case 5:
          this.$ = { type: "LT", left: e[o - 2], right: e[o] };
          break;
        case 6:
          this.$ = { type: "LTE", left: e[o - 2], right: e[o] };
          break;
        case 7:
          this.$ = { type: "GT", left: e[o - 2], right: e[o] };
          break;
        case 8:
          this.$ = { type: "GTE", left: e[o - 2], right: e[o] };
          break;
        case 9:
          this.$ = { type: "NEQ", left: e[o - 2], right: e[o] };
          break;
        case 10:
          this.$ = { type: "EQ", left: e[o - 2], right: e[o] };
          break;
        case 11:
          this.$ = { type: "MOD", left: e[o - 2], right: e[o] };
          break;
        case 12:
          this.$ = { type: "GROUP", expr: e[o - 1] };
          break;
        case 13:
          this.$ = { type: "VAR" };
          break;
        case 14:
          this.$ = { type: "NUM", val: Number(r) };
          break;
      }
    },
    table: [
      { 3: 1, 4: 2, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 1: [3] },
      {
        5: [1, 6],
        6: [1, 7],
        8: [1, 8],
        9: [1, 9],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16]
      },
      { 4: 17, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      {
        5: [2, 13],
        6: [2, 13],
        7: [2, 13],
        8: [2, 13],
        9: [2, 13],
        10: [2, 13],
        11: [2, 13],
        12: [2, 13],
        13: [2, 13],
        14: [2, 13],
        15: [2, 13],
        16: [2, 13],
        18: [2, 13]
      },
      {
        5: [2, 14],
        6: [2, 14],
        7: [2, 14],
        8: [2, 14],
        9: [2, 14],
        10: [2, 14],
        11: [2, 14],
        12: [2, 14],
        13: [2, 14],
        14: [2, 14],
        15: [2, 14],
        16: [2, 14],
        18: [2, 14]
      },
      { 1: [2, 1] },
      { 4: 18, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 19, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 20, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 21, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 22, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 23, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 24, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 25, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 26, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      { 4: 27, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      {
        6: [1, 7],
        8: [1, 8],
        9: [1, 9],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16],
        18: [1, 28]
      },
      {
        6: [1, 7],
        7: [1, 29],
        8: [1, 8],
        9: [1, 9],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16]
      },
      {
        5: [2, 3],
        6: [2, 3],
        7: [2, 3],
        8: [2, 3],
        9: [1, 9],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16],
        18: [2, 3]
      },
      {
        5: [2, 4],
        6: [2, 4],
        7: [2, 4],
        8: [2, 4],
        9: [2, 4],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16],
        18: [2, 4]
      },
      {
        5: [2, 5],
        6: [2, 5],
        7: [2, 5],
        8: [2, 5],
        9: [2, 5],
        10: [2, 5],
        11: [2, 5],
        12: [2, 5],
        13: [2, 5],
        14: [2, 5],
        15: [2, 5],
        16: [1, 16],
        18: [2, 5]
      },
      {
        5: [2, 6],
        6: [2, 6],
        7: [2, 6],
        8: [2, 6],
        9: [2, 6],
        10: [2, 6],
        11: [2, 6],
        12: [2, 6],
        13: [2, 6],
        14: [2, 6],
        15: [2, 6],
        16: [1, 16],
        18: [2, 6]
      },
      {
        5: [2, 7],
        6: [2, 7],
        7: [2, 7],
        8: [2, 7],
        9: [2, 7],
        10: [2, 7],
        11: [2, 7],
        12: [2, 7],
        13: [2, 7],
        14: [2, 7],
        15: [2, 7],
        16: [1, 16],
        18: [2, 7]
      },
      {
        5: [2, 8],
        6: [2, 8],
        7: [2, 8],
        8: [2, 8],
        9: [2, 8],
        10: [2, 8],
        11: [2, 8],
        12: [2, 8],
        13: [2, 8],
        14: [2, 8],
        15: [2, 8],
        16: [1, 16],
        18: [2, 8]
      },
      {
        5: [2, 9],
        6: [2, 9],
        7: [2, 9],
        8: [2, 9],
        9: [2, 9],
        10: [2, 9],
        11: [2, 9],
        12: [2, 9],
        13: [2, 9],
        14: [2, 9],
        15: [2, 9],
        16: [1, 16],
        18: [2, 9]
      },
      {
        5: [2, 10],
        6: [2, 10],
        7: [2, 10],
        8: [2, 10],
        9: [2, 10],
        10: [2, 10],
        11: [2, 10],
        12: [2, 10],
        13: [2, 10],
        14: [2, 10],
        15: [2, 10],
        16: [1, 16],
        18: [2, 10]
      },
      {
        5: [2, 11],
        6: [2, 11],
        7: [2, 11],
        8: [2, 11],
        9: [2, 11],
        10: [2, 11],
        11: [2, 11],
        12: [2, 11],
        13: [2, 11],
        14: [2, 11],
        15: [2, 11],
        16: [2, 11],
        18: [2, 11]
      },
      {
        5: [2, 12],
        6: [2, 12],
        7: [2, 12],
        8: [2, 12],
        9: [2, 12],
        10: [2, 12],
        11: [2, 12],
        12: [2, 12],
        13: [2, 12],
        14: [2, 12],
        15: [2, 12],
        16: [2, 12],
        18: [2, 12]
      },
      { 4: 30, 17: [1, 3], 19: [1, 4], 20: [1, 5] },
      {
        5: [2, 2],
        6: [1, 7],
        7: [2, 2],
        8: [1, 8],
        9: [1, 9],
        10: [1, 10],
        11: [1, 11],
        12: [1, 12],
        13: [1, 13],
        14: [1, 14],
        15: [1, 15],
        16: [1, 16],
        18: [2, 2]
      }
    ],
    defaultActions: { 6: [2, 1] },
    parseError: function(r, i) {
      throw new Error(r);
    },
    parse: function(r) {
      var i = this, s = [0], c = [null], u = [], e = this.table, f = "", o = 0, y = 0, h = 0, x = 2, P = 1;
      this.lexer.setInput(r), this.lexer.yy = this.yy, this.yy.lexer = this.lexer, typeof this.lexer.yylloc > "u" && (this.lexer.yylloc = {});
      var w = this.lexer.yylloc;
      u.push(w), typeof this.yy.parseError == "function" && (this.parseError = this.yy.parseError);
      function D(m) {
        s.length = s.length - 2 * m, c.length = c.length - m, u.length = u.length - m;
      }
      function R() {
        var m;
        return m = i.lexer.lex() || 1, typeof m != "number" && (m = i.symbols_[m] || m), m;
      }
      for (var p, k, g, d, A, b = {}, F, _, T, v; ; ) {
        if (g = s[s.length - 1], this.defaultActions[g] ? d = this.defaultActions[g] : (p == null && (p = R()), d = e[g] && e[g][p]), typeof d > "u" || !d.length || !d[0]) {
          if (!h) {
            v = [];
            for (F in e[g])
              this.terminals_[F] && F > 2 && v.push("'" + this.terminals_[F] + "'");
            var E = "";
            this.lexer.showPosition ? E = "Parse error on line " + (o + 1) + `:
` + this.lexer.showPosition() + `
Expecting ` + v.join(", ") + ", got '" + this.terminals_[p] + "'" : E = "Parse error on line " + (o + 1) + ": Unexpected " + (p == 1 ? "end of input" : "'" + (this.terminals_[p] || p) + "'"), this.parseError(E, {
              text: this.lexer.match,
              token: this.terminals_[p] || p,
              line: this.lexer.yylineno,
              loc: w,
              expected: v
            });
          }
          if (h == 3) {
            if (p == P)
              throw new Error(E || "Parsing halted.");
            y = this.lexer.yyleng, f = this.lexer.yytext, o = this.lexer.yylineno, w = this.lexer.yylloc, p = R();
          }
          for (; !(x.toString() in e[g]); ) {
            if (g == 0)
              throw new Error(E || "Parsing halted.");
            D(1), g = s[s.length - 1];
          }
          k = p, p = x, g = s[s.length - 1], d = e[g] && e[g][x], h = 3;
        }
        if (d[0] instanceof Array && d.length > 1)
          throw new Error(
            "Parse Error: multiple actions possible at state: " + g + ", token: " + p
          );
        switch (d[0]) {
          case 1:
            s.push(p), c.push(this.lexer.yytext), u.push(this.lexer.yylloc), s.push(d[1]), p = null, k ? (p = k, k = null) : (y = this.lexer.yyleng, f = this.lexer.yytext, o = this.lexer.yylineno, w = this.lexer.yylloc, h > 0 && h--);
            break;
          case 2:
            if (_ = this.productions_[d[1]][1], b.$ = c[c.length - _], b._$ = {
              first_line: u[u.length - (_ || 1)].first_line,
              last_line: u[u.length - 1].last_line,
              first_column: u[u.length - (_ || 1)].first_column,
              last_column: u[u.length - 1].last_column
            }, A = this.performAction.call(
              b,
              f,
              y,
              o,
              this.yy,
              d[1],
              c,
              u
            ), typeof A < "u")
              return A;
            _ && (s = s.slice(0, -1 * _ * 2), c = c.slice(0, -1 * _), u = u.slice(0, -1 * _)), s.push(this.productions_[d[1]][0]), c.push(b.$), u.push(b._$), T = e[s[s.length - 2]][s[s.length - 1]], s.push(T);
            break;
          case 3:
            return !0;
        }
      }
      return !0;
    }
  }, n = function() {
    var l = {
      EOF: 1,
      parseError: function(i, s) {
        if (this.yy.parseError)
          this.yy.parseError(i, s);
        else
          throw new Error(i);
      },
      setInput: function(r) {
        return this._input = r, this._more = this._less = this.done = !1, this.yylineno = this.yyleng = 0, this.yytext = this.matched = this.match = "", this.conditionStack = ["INITIAL"], this.yylloc = {
          first_line: 1,
          first_column: 0,
          last_line: 1,
          last_column: 0
        }, this;
      },
      input: function() {
        var r = this._input[0];
        this.yytext += r, this.yyleng++, this.match += r, this.matched += r;
        var i = r.match(/\n/);
        return i && this.yylineno++, this._input = this._input.slice(1), r;
      },
      unput: function(r) {
        return this._input = r + this._input, this;
      },
      more: function() {
        return this._more = !0, this;
      },
      pastInput: function() {
        var r = this.matched.substr(
          0,
          this.matched.length - this.match.length
        );
        return (r.length > 20 ? "..." : "") + r.substr(-20).replace(/\n/g, "");
      },
      upcomingInput: function() {
        var r = this.match;
        return r.length < 20 && (r += this._input.substr(0, 20 - r.length)), (r.substr(0, 20) + (r.length > 20 ? "..." : "")).replace(
          /\n/g,
          ""
        );
      },
      showPosition: function() {
        var r = this.pastInput(), i = new Array(r.length + 1).join("-");
        return r + this.upcomingInput() + `
` + i + "^";
      },
      next: function() {
        if (this.done)
          return this.EOF;
        this._input || (this.done = !0);
        var r, i, s;
        this._more || (this.yytext = "", this.match = "");
        for (var c = this._currentRules(), u = 0; u < c.length; u++)
          if (i = this._input.match(this.rules[c[u]]), i)
            return s = i[0].match(/\n.*/g), s && (this.yylineno += s.length), this.yylloc = {
              first_line: this.yylloc.last_line,
              last_line: this.yylineno + 1,
              first_column: this.yylloc.last_column,
              last_column: s ? s[s.length - 1].length - 1 : this.yylloc.last_column + i[0].length
            }, this.yytext += i[0], this.match += i[0], this.matches = i, this.yyleng = this.yytext.length, this._more = !1, this._input = this._input.slice(i[0].length), this.matched += i[0], r = this.performAction.call(
              this,
              this.yy,
              this,
              c[u],
              this.conditionStack[this.conditionStack.length - 1]
            ), r || void 0;
        if (this._input === "")
          return this.EOF;
        this.parseError(
          "Lexical error on line " + (this.yylineno + 1) + `. Unrecognized text.
` + this.showPosition(),
          { text: "", token: null, line: this.yylineno }
        );
      },
      lex: function() {
        var i = this.next();
        return typeof i < "u" ? i : this.lex();
      },
      begin: function(i) {
        this.conditionStack.push(i);
      },
      popState: function() {
        return this.conditionStack.pop();
      },
      _currentRules: function() {
        return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
      },
      topState: function() {
        return this.conditionStack[this.conditionStack.length - 2];
      },
      pushState: function(i) {
        this.begin(i);
      }
    };
    return l.performAction = function(i, s, c, u) {
      switch (c) {
        case 0:
          break;
        case 1:
          return 20;
        case 2:
          return 19;
        case 3:
          return 8;
        case 4:
          return 9;
        case 5:
          return 6;
        case 6:
          return 7;
        case 7:
          return 11;
        case 8:
          return 13;
        case 9:
          return 10;
        case 10:
          return 12;
        case 11:
          return 14;
        case 12:
          return 15;
        case 13:
          return 16;
        case 14:
          return 17;
        case 15:
          return 18;
        case 16:
          return 5;
        case 17:
          return "INVALID";
      }
    }, l.rules = [
      /^\s+/,
      /^[0-9]+(\.[0-9]+)?\b/,
      /^n\b/,
      /^\|\|/,
      /^&&/,
      /^\?/,
      /^:/,
      /^<=/,
      /^>=/,
      /^</,
      /^>/,
      /^!=/,
      /^==/,
      /^%/,
      /^\(/,
      /^\)/,
      /^$/,
      /^./
    ], l.conditions = {
      INITIAL: {
        rules: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        inclusive: !0
      }
    }, l;
  }();
  return t.lexer = n, t;
}();
export {
  a as Jed
};
