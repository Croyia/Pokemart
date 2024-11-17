import { GlobalStyles } from "@mui/material";

const GlobalScrollbarStyles = () => (
  <GlobalStyles
    styles={{
      "*::-webkit-scrollbar": {
        width: "0.4em",
        height: "0.4em",
      },
      "*::-webkit-scrollbar-track": {
        WebkitBoxShadow: "inset 0 0 6px rgba(0,0,0,0.00)",
        borderRadius: "8px",
        backgroundColor: "transparent",
      },
      "*::-webkit-scrollbar-thumb": {
        backgroundColor: "rgba(0, 67, 178, 0.3)",
        borderRadius: "8px",
        "&:hover": {
          backgroundColor: "rgba(0, 67, 178, 0.5)",
        },
        "&:active": {
          backgroundColor: "rgba(0, 67, 178, 0.7)",
        },
      },
      "*": {
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(0, 67, 178, 0.3) transparent",
      },
    }}
  />
);

export default GlobalScrollbarStyles;
