import React from "react";
import { Box, Modal, Paper, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TemplateForm from "./TemplateForm";

const EditModal = ({
  open,
  onClose,
  item,
  onSubmit,
  title = "Edit Item",
  suppliers,
}) => {
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: 700,
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
            id="edit-modal-title"
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

        <Box sx={{ p: 3 }}>
          <TemplateForm
            isEdit={true}
            initialData={item}
            onSubmit={onSubmit}
            suppliers={suppliers}
          />
        </Box>
      </Paper>
    </Modal>
  );
};

export default EditModal;
