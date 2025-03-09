# Weekly Time Allocation - Developer Guidelines

## Build Commands
- Start local server: `npm start` or `node server.js`
- Build for distribution: `npm run build`
- Run Storybook: `npm run storybook`
- Build Storybook: `npm run build-storybook`

## Code Style Guidelines
- **JavaScript**: CommonJS modules (`type: "commonjs"`)
- **Formatting**: 2-space indentation, semicolons required
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Functions**: Pure utility functions in utils.js, component logic in index.js
- **HTML**: Use semantic HTML elements and BEM-like class naming
- **CSS**: Tailwind CSS for styling
- **Error Handling**: Validate inputs and provide clear error messages
- **Data Management**: Project data stored in data/projectData.js
- **State Management**: Use simple state variables and DOM manipulation
- **DOM Updates**: Generate HTML strings or create elements with appendChild

## Project Structure
- `index.js` - Main application logic
- `utils.js` - Utility functions (validation, calculations)
- `sampleData.js` - Test data generator
- `data/projectData.js` - Project definitions
- `server.js` - Simple Node.js development server