import React from "react";
import {
  Box,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TemplateTable from "./TemplateTable";
import TemplateWidget from "./TemplateWidget";
import Grid from "@mui/material/Grid2";
import { useNavigate } from "react-router-dom";
import SuppliersTable from "./SuppliersTable";

const Dashboard = ({ transactions, suppliers, onRefresh, showMessage }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile || isTablet) {
    return (
      <Box sx={{ px: { xs: 2, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <Box display="flex" flexDirection="column" gap={2} mb={3}>
          <Typography
            color="primary"
            variant="h1"
            fontWeight={800}
            textAlign="center"
          >
            Pokemart Inventory
          </Typography>

          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<AddIcon />}
            sx={{
              fontSize: "12px",
              height: "40px",
            }}
            onClick={() => navigate("/create-item")}
          >
            Add PokeItem
          </Button>
        </Box>

        <Box mb={3}>
          <TemplateTable
            transactions={transactions}
            onRefresh={onRefresh}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        </Box>

        <Box>
          <Typography
            color="primary"
            variant="h1"
            fontWeight={700}
            textAlign="center"
            mb={2}
          >
            Stock Keeping Unit Trackers
          </Typography>

          <Box display="flex" flexDirection="column" gap={2}>
            <TemplateWidget
              transactions={transactions}
              isMobile={isMobile}
              isTablet={isTablet}
            />
            <SuppliersTable
              transactions={transactions}
              suppliers={suppliers}
              onRefresh={onRefresh}
              showMessage={showMessage}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mt: "20px" }}>
      <Grid item size={9} sx={{ pl: "30px" }}>
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyItems="center"
          width="100%"
        >
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <Typography color="primary" variant="h1" fontWeight={800}>
              Pokemart Inventory
            </Typography>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              startIcon={<AddIcon />}
              sx={{ width: "160px", fontSize: "12px" }}
              onClick={() => navigate("/create-item")}
            >
              Add PokeItem
            </Button>
          </Box>

          <TemplateTable transactions={transactions} onRefresh={onRefresh} />
        </Box>
      </Grid>
      <Grid size={3} pr="20px">
        <Box mb="10px">
          <Typography color="primary" variant="h1" fontWeight={700}>
            Stock Keeping Unit Trackers
          </Typography>
        </Box>
        <TemplateWidget transactions={transactions} />
        <SuppliersTable
          transactions={transactions}
          suppliers={suppliers}
          onRefresh={onRefresh}
          showMessage={showMessage}
        />
      </Grid>
    </Grid>
  );
};

export default Dashboard;
