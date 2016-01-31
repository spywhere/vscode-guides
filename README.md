## Guides
A Visual Studio Code extension for more guide lines

![Screenshot](images/screenshot.png)

### What is Guides?
Guides is simply an extension that add an indentation guideline and your own ruler guide lines.

### How it works?
Simply install the extension, Guides should do it job right away (after restart)!

**Note** that all guide lines only show when the text is exceeding the limit due to the extension API limitation.

### What are the settings?
```
//-------- Guides Configurations --------

// Normal indentation guides rendering width.
"guides.normal.width": "1px",

// Normal indentation guides rendering color.
"guides.normal.color": "#333333",

// Normal indentation guides rendering style.
"guides.normal.style": "solid",

// Hide normal indentation guides in selections.
"guides.normal.hideOnSelection": true,

// Ruler guide stop points.
"guides.rulers": [],

// Ruler guides rendering width.
"guides.ruler.width": "1px",

// Ruler guides rendering color.
"guides.ruler.color": "#cc9999",

// Ruler guides rendering style.
"guides.ruler.style": "solid",

// Hide ruler guides in selections.
"guides.ruler.hideOnSelection": true
```
Possible values can be access via auto-completion dialog.

### License?
MIT
