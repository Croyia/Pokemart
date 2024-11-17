import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Link,
} from "@mui/material";
import TemplateForm from "./TemplateForm";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../api";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
const CreateItem = ({ onRefresh, showMessage, suppliers }) => {
  const navigate = useNavigate();

  const handleFormSubmit = async (values) => {
    try {
      await api.post("/transactions", values);
      await onRefresh();
      showMessage("Item successfully added!", "success");
      navigate("/");
    } catch (error) {
      showMessage("Failed to add item. Please try again.", "error");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate("/")} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" color="primary" fontWeight={700}>
          Create New Item
        </Typography>
      </Stack>

      <Box sx={{ maxWidth: "800px", mx: "auto" }}>
        <TemplateForm
          handleFormSubmit={handleFormSubmit}
          suppliers={suppliers}
        />

        <Box
          sx={{
            mt: 5,
            p: 2,
            border: "2px dashed",
            borderColor: "primary.light",
            borderRadius: 2,
            position: "relative",
            bgcolor: "primary.50",
            "&::before": {
              content: '""',
              position: "absolute",
              top: -2,
              left: 20,
              right: 20,
              height: 2,
              bgcolor: "background.paper",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -2,
              left: 20,
              right: 20,
              height: 2,
              bgcolor: "background.paper",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
            <InfoOutlinedIcon
              size={20}
              style={{
                color: "rgb(9, 89, 205)",
                flexShrink: 0,
                marginTop: "2px",
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Need help with PokéItems?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visit{" "}
                <Link
                  href="https://pokemondb.net/item/all"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    fontWeight: 500,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  PokemonDB
                </Link>{" "}
                for more information about items.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateItem;
