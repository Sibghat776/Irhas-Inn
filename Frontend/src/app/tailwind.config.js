import theme from "./src/theme.js";

module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: theme.colors.primary,
                primaryLight: theme.colors.primaryLight,
                primaryDark: theme.colors.primaryDark,
                secondary: theme.colors.secondary,
                textLight: theme.colors.textLight,
                textDark: theme.colors.textDark,
                bgDark: theme.colors.bgDark,
                bgLight: theme.colors.bgLight,
                hover: theme.colors.hover,
            },
            fontFamily: {
                brand: theme.fonts.brand    ,
                body: theme.fonts.body,
            },
        },
    },
    plugins: [],
};
