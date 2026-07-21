const theme = {
  colors: {
    primary: "#00ADB5",
    secondary: "#00ADB5",
    beige: "#EEEEEE",
    cream: "#FFFFFF",
    textLight: "#ffffff",
    textDark: "#222831",
    bgDark: "#00ADB5",
    bgLight: "#FFFFFF",
    hover: "#00ADB5",
  },
  fonts: {
    brand: "Dancing Script, cursive",
    body: "Inter, sans-serif",
  },
};

module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: theme.colors.primary,
                secondary: theme.colors.secondary,
                beige: theme.colors.beige,
                cream: theme.colors.cream,
                textLight: theme.colors.textLight,
                textDark: theme.colors.textDark,
                bgDark: theme.colors.bgDark,
                bgLight: theme.colors.bgLight,
                hover: theme.colors.hover,
            },
            fontFamily: {
                brand: theme.fonts.brand,
                body: theme.fonts.body,
            },
        },
    },
    plugins: [],
};
