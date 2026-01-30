module.exports = {
   content: [
      "./app/**/*.{js,ts,jsx,tsx,mdx}",
      "./components/**/*.{js,ts,jsx,tsx,mdx}",
   ],
   theme: {
      extend: {
         colors: {
            'background-light': '#F8F4EE',
            'foregroud-black': '#2E2E2E'
         },
         fontFamily: {
            fira: ["var(--font-fira-code)", "monospace"],
         },
      },
   },
   plugins: [],
};