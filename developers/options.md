## Indentation Mode

- normal indentation mode:
  > active indentation is the container's indentation of the cursor position

- extra indentation mode (`active.extraIndent`):
  > active indentation is the left most indentation to the cursor position

## Migration

- Before: `guides.enabled`  
After: *Removed - Use `guides.limit.mode` instead*  
Type/Values: boolean  
Default: true  
Description: Enable the extension.

- Before: *Not Available*  
After: `guides.limit.mode`  
Type/Values: `none` / `visible` / `lazy-visible` / `all`   
Default: `visible`, if available, otherwise `none`  
Description: Rendering limit mode.
Set to "none" to render on all lines.
Set to "visible" to render (at most) only visible lines and update them as the editor changes.
Set to "lazy-visible" to render (at most) only visible lines.
Set to "all" to disable the extension (no render).

- Before: `guides.limit.maximum`  
After: *Same*  
Type/Values: number  
Default: 500  
Description: Maximum rendering boundary (based on the current cursor position).
Set to -1 for render on all lines.
Set to 0 for render only in the current line.
Use floating point between 0-1 to determine from document size.

- Before: *Not Available*  
After: `guides.limit.progressive`  
Type/Values: number  
Default: 5  
Description: Make the rendering guides fade towards a transparent within specified number of lines.
Must be less than "guides.limit.maximum" but more than 0, otherwise this option will be ignored.

- Before: `guides.indent.showFirstIndentGuides`  
After: *Same*  
Type/Values: boolean  
Default: true  
Description: Render start-of-line indentation guides.

- Before: `guides.indent.backgrounds`  
After: `guides.indent.background.colors`  
Type/Values: string[]  
Default: []  
Description: Render indentation background colors.

- Before: `guides.indent.hideBackgroundOnSelection`  
After: `guides.indent.background.hideOnSelection`  
Type/Values: boolean  
Default: true  
Description: Hide indentation backgrounds in selections.

- Before: `guides.[normal/active/stack].enabled`  
After: *Removed - Use `guides.[normal/active/stack].style` instead*  
Type/Values: boolean  
Default: true  
Description: Enable [normal/active/stack] indentation guides.

- Before: `guides.[normal/active/stack].style`  
After: *Same*  
Type/Values: `none` / `dotted` / `dashed` / `solid` / `double` / `groove` / `ridge` / `inset` / `outset`  
Default: `solid`  
Description: Rendering style for [normal/active/stack] indentation guides.

- Before: `guides.[normal/active/stack].width`  
After: *Same*  
Type/Values: number  
Default: 1  
Description: Rendering width for [normal/active/stack] indentation guides.

- Before: `guides.[normal/active/stack].color.light`  
After: *Removed - Use `guides.[normal/active/stack].colors.light` instead*  
Type/Values: string  
Default: *Based on the type*  
Description: Rendering color for [normal/active/stack] indentation guides.

- Before: `guides.[normal/active/stack].color.dark`  
After: *Removed - Use `guides.[normal/active/stack].colors.dark` instead*  
Type/Values: string  
Default: *Based on the type*  
Description: Rendering color for [normal/active/stack] indentation guides.

- Before: *Not Available*  
After: `guides.[normal/active/stack].colors.light`  
Type/Values: string[]  
Default: *Based on the type*  
Description: Rendering colors for [normal/active/stack] indentation guides on light theme.

- Before: *Not Available*  
After: `guides.[normal/active/stack].colors.dark`  
Type/Values: string[]  
Default: *Based on the type*  
Description: Rendering colors for [normal/active/stack] indentation guides on dark theme.

- Before: `guides.[normal/active/stack].hideOnSelection`  
After: *Same*  
Type/Values: boolean  
Default: true  
Description: Hide [normal/active/stack] indentation guides in selections.

- Before: `guides.active.gutter`  
After: *Same*  
Type/Values: boolean  
Default: false  
Description: Render active indentation region indicator in the gutter area.

- Before: `guides.active.expandBrackets`  
After: *Same*  
Type/Values: boolean  
Default: true  
Description: Expand active indentation guides when the cursor is on brackets.

- Before: `guides.active.extraIndent`  
After: *Same*  
Type/Values: boolean  
Default: false  
Description: Shift active indentations by a level.
This will also render extra indentation guides.

- Before: `guides.updateDelay`  
After: *Same*  
Type/Values: number  
Default: 0.1  
Description: Time duration between each update (in seconds).

- Before: `guides.overrideDefault`  
After: *Same*  
Type/Values: boolean  
Default: false  
Description: Suppress suggestions toward default Visual Studio Code behaviours.

- Before: `guides.sendUsagesAndStats`  
After: *Same*  
Type/Values: boolean  
Default: true  
Description: Send anonymous usage statistics data to the developer.
