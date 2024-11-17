import { Box, Typography, Paper } from "@mui/material";
import React from "react";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";

const TemplateWidget = ({ transactions = [] }) => {
  const availableItemsCount = transactions.filter(
    (item) => item.quantity >= 10
  ).length;

  const lowItemsCount = transactions.filter(
    (item) => item.quantity < 10 && item.quantity > 0
  ).length;

  const unavailableItemsCount = transactions.filter(
    (item) => item.quantity === 0
  ).length;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        width="100%"
        p={2.5}
        sx={{
          backgroundColor: "primary.main",
          borderRadius: 2,
          mb: "10px",
        }}
        display="flex"
        alignItems="center"
      >
        <InventoryOutlinedIcon
          sx={{
            color: "white",
            borderRadius: "4px",
            padding: "4px",
            fontSize: "32px",
            mr: "10px",
          }}
        />
        <Typography color="white" fontSize="14px" textAlign="left">
          <span
            style={{ fontSize: "18px", fontWeight: "bold", marginRight: "8px" }}
          >
            {transactions.length}
          </span>
          Total Stock Keeping Units
        </Typography>
      </Box>

      <Box
        width="100%"
        p={2.5}
        sx={{
          backgroundColor: "primary.main",
          borderRadius: 2,
          mb: "10px",
        }}
        display="flex"
        flexDirection="column"
        gap={2}
      >
        <Box display="flex" alignItems="center">
          <PriorityHighOutlinedIcon
            sx={{
              color: "white",
              borderRadius: "4px",
              padding: "4px",
              fontSize: "32px",
              mr: "10px",
            }}
          />
          <Typography color="white" fontSize="14px" textAlign="left">
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginRight: "8px",
              }}
            >
              {lowItemsCount}
            </span>
            Low Stock Keeping Units
          </Typography>
        </Box>

        <Box display="flex" alignItems="center">
          <DoNotDisturbOnOutlinedIcon
            sx={{
              color: "white",
              borderRadius: "4px",
              padding: "4px",
              fontSize: "32px",
              mr: "10px",
            }}
          />
          <Typography color="white" fontSize="14px" textAlign="left">
            <span
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginRight: "8px",
              }}
            >
              {unavailableItemsCount}
            </span>
            Unavailable Stock Keeping Units
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default TemplateWidget;
