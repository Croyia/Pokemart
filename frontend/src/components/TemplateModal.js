import React from "react";
import { Box, Modal, Paper, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const TemplateModal = ({ title, children, open, onClose, width = 700 }) => {
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: width,
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: 2,
    p: 0,
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper sx={style} elevation={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 5,
            pt: 4,
          }}
        >
          <Typography
            id="modal-title"
            variant="h6"
            component="h2"
            fontWeight="600"
            color="primary"
          >
            {title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 3 }}>{children}</Box>
      </Paper>
    </Modal>
  );
};

export default TemplateModal;
