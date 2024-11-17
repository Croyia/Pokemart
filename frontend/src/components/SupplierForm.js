import React from "react";
import { Box, TextField, Button } from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";
import Grid from "@mui/material/Grid2";

const SupplierForm = ({
  isEdit = false,
  initialData = null,
  onSubmit,
  handleFormSubmit = null,
}) => {
  const validationSchema = Yup.object({
    supplier_name: Yup.string()
      .required("Supplier name is required")
      .min(2, "Supplier name must be at least 2 characters")
      .max(50, "Supplier name must be less than 50 characters"),
    supplier_contact_person: Yup.string()
      .required("Contact person is required")
      .min(2, "Contact person must be at least 2 characters")
      .max(50, "Contact person must be less than 50 characters"),
    supplier_contact_number: Yup.string()
      .required("Contact number is required")
      .matches(
        /^[0-9+-]+$/,
        "Contact number can only contain numbers, plus sign, and hyphens"
      )
      .min(7, "Contact number must be at least 7 characters")
      .max(15, "Contact number must be less than 15 characters"),
  });

  const formik = useFormik({
    initialValues: isEdit
      ? initialData
      : {
          supplier_name: "",
          supplier_contact_person: "",
          supplier_contact_number: "",
        },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      if (isEdit) {
        onSubmit(values);
      } else {
        handleFormSubmit(values);
      }
    },
  });

  return (
    <Box>
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3} p={2}>
          <Grid item size={6}>
            <TextField
              fullWidth
              label="Supplier Name"
              name="supplier_name"
              value={formik.values.supplier_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.supplier_name &&
                Boolean(formik.errors.supplier_name)
              }
              helperText={
                formik.touched.supplier_name && formik.errors.supplier_name
              }
              variant="outlined"
              placeholder="e.g., Silph Co."
              size="small"
            />
          </Grid>

          <Grid item size={6}>
            <TextField
              fullWidth
              label="Contact Person"
              name="supplier_contact_person"
              value={formik.values.supplier_contact_person}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.supplier_contact_person &&
                Boolean(formik.errors.supplier_contact_person)
              }
              helperText={
                formik.touched.supplier_contact_person &&
                formik.errors.supplier_contact_person
              }
              variant="outlined"
              placeholder="e.g., John Smith"
              size="small"
            />
          </Grid>

          <Grid item size={6}>
            <TextField
              fullWidth
              label="Contact Number"
              name="supplier_contact_number"
              value={formik.values.supplier_contact_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.supplier_contact_number &&
                Boolean(formik.errors.supplier_contact_number)
              }
              helperText={
                formik.touched.supplier_contact_number &&
                formik.errors.supplier_contact_number
              }
              variant="outlined"
              placeholder="e.g., +1-234-567-8900"
              size="small"
            />
          </Grid>
        </Grid>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            justifyContent: "flex-end",
            p: 2,
          }}
        >
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              width: "100px",
              height: "32px",
              fontSize: "13px",
              borderRadius: 1,
            }}
            disabled={!formik.isValid || formik.isSubmitting}
          >
            {isEdit ? "Update" : "Submit"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default SupplierForm;
