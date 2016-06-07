## Guides
[![Version](http://vsmarketplacebadge.apphb.com/version/spywhere.guides.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.guides)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/spywhere.guides.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.guides)

A Visual Studio Code extension for more guide lines

![Screenshot](images/screenshot.png)

### What is Guides?
Guides is simply an extension that add indentation guide lines and your own ruler guide lines.

### How Guides different from built-in indentation guides?
- Active indentation guides
- Indentation backgrounds
- Color and style customizations
- Hide on selection

If you just want simple indentation guides, Guides kindly recommended that you use built-in indentation guides instead.

### How it works?
Simply install the extension, Guides should do it job right away (after restart)!

**Note** that all guide lines only show when the text is exceeding the limit due to the extension API limitation.

### What are the settings?
```
//-------- Guides Configurations --------

// Indentation background colors. This settings may cause slow performance on multiple indentations.
//   Each color will be used for each indentation level and will loop around itself.
//   Values must be in "rgba(red, green, blue, alpha)" format.
"guides.indent.backgrounds": [],

// Hide indentation background in selections.
"guides.indent.hideBackgroundOnSelection": true,

// Show start-of-line indentation guides.
"guides.indent.showFirstIndentGuides": true,

// Normal indentation guides rendering width.
"guides.normal.width": 1,

// Normal indentation guides rendering color.
"guides.normal.color": "rgba(60, 60, 60, 0.75)",

// Normal indentation guides rendering style.
"guides.normal.style": "solid",

// Hide normal indentation guides in selections.
"guides.normal.hideOnSelection": true,

// Enable active indentation guides in addition to normal indentation guides.
"guides.active.enabled": true,

// Active indentation guides rendering width.
"guides.active.width": 1,

// Active indentation guides rendering color.
"guides.active.color": "rgba(120, 60, 60, 0.75)",

// Active indentation guides rendering style.
"guides.active.style": "solid",

// Hide active indentation guides in selections.
"guides.active.hideOnSelection": true,

// Ruler guide stop points.
"guides.rulers": [],

// Ruler guides rendering width.
"guides.ruler.width": 1,

// Ruler guides rendering color.
"guides.ruler.color": "#cc9999",

// Ruler guides rendering style.
"guides.ruler.style": "solid",

// Hide ruler guides in selections.
"guides.ruler.hideOnSelection": true,

// Time duration between each guide lines update (in seconds).
"guides.updateDelay": 0.1,

// Override default Visual Studio Code behaviours.
//   Set to "true" to suppress any suggestion towards default Visual Studio Code behaviours.
"guides.overrideDefault": false,

// Send anonymous usage statistics data to the developer.
"guides.sendUsagesAndStats": true,
```
Possible values can be access via auto-completion dialog.

### FAQs

**Q:** Why guide lines show fragmented on empty lines?  
**A:** Guides use border to draw its guide lines which required the character to be there.
Since Visual Studio Code API does not provide the API for drawing line on empty space, this can be expected. 

**Q:** License?  
**A:** MIT
