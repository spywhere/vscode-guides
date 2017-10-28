## Guides
[![Version](https://vsmarketplacebadge.apphb.com/version/spywhere.guides.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.guides)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/spywhere.guides.svg)](https://marketplace.visualstudio.com/items?itemName=spywhere.guides)

develop|master
:-:|:-:
[![develop build](https://img.shields.io/travis/spywhere/vscode-guides/develop.svg)](https://travis-ci.org/spywhere/vscode-guides)|[![master build](https://img.shields.io/travis/spywhere/vscode-guides/master.svg)](https://travis-ci.org/spywhere/vscode-guides)

A Visual Studio Code extension for more guide lines

![Screenshot](images/screenshot.png)

### What is Guides?
Guides is simply an extension that add various indentation guide lines

### How Guides different from built-in indentation guides?
- Stack and Active indentation guides
- Indentation backgrounds
- Color and style customizations
- Hide on selection

If you just want simple indentation guides, Guides kindly recommended that you use built-in indentation guides instead.

### How it works?
Simply install the extension, Guides should do it job right away (after restart)!

**Note** that all guide lines only show when the text is exceeding the limit due to the extension API limitation.

### Customizations

Please take a look at preferences to see all available options.
Possible values can be access via auto-completion dialog.
The following options might affect how Guides performs...

- `guides.indent.backgrounds`:  
This settings may cause slow performances on multiple indentations.
Each color will be used for each indentation level and will loop around itself.
Value must be in `rgba(red, green, blue, alpha)` format

- `guides.limit.maximum`:  
Set to `-1` for unlimited maximum rendering boundary.  
Set to floating point between `0` and `1` will based the limit from document size.
For example, `0.5` will render guides covered at maximum of 50% in current document.  
Set to `1` or more to render at maximum of specified number of lines.

- `guides.overrideDefault`:  
Set to "true" to suppress any suggestion towards default Visual Studio Code behaviours.

### FAQs

**Q:** Why guide lines show fragmented on empty lines?  
**A:** Guides use border to draw its guide lines which required the character to be there.
Since Visual Studio Code API does not provide the API for drawing line on empty space, this can be expected.

**Q:** What is the different in each guide line type?  
**A:**
- *Normal indentation guide* is a line that run down along each indentation level.
- *Active indentation guide* is a line that run down along the last indentation level of the current line.
- *Stack indentation guide* is a line that run down along each indentation level that comes before the active indentation level.

**Q:** License?  
**A:** MIT
