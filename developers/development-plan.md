# Overview

## Goal

- High performance
- Highly configurable
- High reliability and stability

## Structure

- Modular implementation (rendering should be separated from the logic)
- Testable code

# Project Structure

## Binders

Event binder, fire an event only when needed

## Controllers

An orchestrator for render an indentation guide from the core logic

## Core

Pure core logic of the extension, render-independent

- [ ] Editor Context  
Hold a state of the editor, such as a current tab size and configurations

- [ ] Indent Guide  
Calculate and returns a list of position in a string (called `IndentGuide`)
where an indentation indication should be

- [ ] Active Guide  
Calculate and returns an index of active guide from a list of `IndentGuide`

- [ ] Indent Range  
Convert a list of `IndentGuide` into a list of different types of indentation
guides (called `IndentRange`) such as stack, normal, active and more

- [ ] Configurations  
Platform-indenpendent configurations, which makes it test-friendly

## Rendering

- [ ] Decoration Manager  
Create and returns an editor decoration,
while maximize the reusability of the decoration by reusing it if needed
