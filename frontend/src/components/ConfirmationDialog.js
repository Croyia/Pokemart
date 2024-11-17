import React from "react";
import {
  Box,
  Modal,
  Paper,
  Typography,
  IconButton,
  Button,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";

const ConfirmationDialog = ({ open, onClose, onConfirm, item }) => {
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 400,
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: 0,
  };

  //   console.log("selected item", item);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="delete-confirmation-title"
      aria-describedby="delete-confirmation-description"
    >
      <Paper sx={style} elevation={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            pt: 2,
            pb: 1,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Box display={"flex"} alignItems={"center"} gap={"10px"}>
              <DeleteOutlineOutlinedIcon
                color="primary"
                sx={{ fontSize: "20px" }}
              />
              <Typography
                sx={{ fontSize: "18px" }}
                fontWeight="600"
                color="primary"
              >
                Confirm Deletion
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ px: 3, py: 2, textAlign: "center" }}>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to delete{" "}
            <strong>{item?.product_name}</strong>? This action cannot be undone.
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button fullWidth variant="outlined" onClick={onClose} size="small">
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={onConfirm}
              size="small"
            >
              Delete
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Modal>
  );
};

export default ConfirmationDialog;
