import React, { useState } from 'react';
import {
	Box,
	Drawer,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Collapse,
	Toolbar,
	AppBar,
	Typography
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';

const drawerWidth = 240;

const sidebarMenu = [
	{
		text: 'Dashboard',
		icon: <DashboardIcon />,
		path: '/logistics/dashboard',
	},
	{
		text: 'Inventory',
		icon: <Inventory2Icon />,
		submenu: [
			{
				text: 'Add Item',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/add',
			},
			{
				text: 'Stores Request',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/request',
			},
			{
				text: 'Request Status',
				icon: <AssessmentIcon />,
				path: '/logistics/inventory/request-status',
			},
			{
				text: 'Approve Requests',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/approve',
			},
			{
				text: 'Assign Item Category',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/category-admin',
			},
			{
				text: 'Stock Levels',
				icon: <AssessmentIcon />,
				path: '/logistics/inventory/stock',
			},
			{
				text: 'Consumables',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/consumables',
			},
			{
				text: 'Alerts',
				icon: <AssessmentIcon />,
				path: '/logistics/inventory/alerts',
			},
			{
				text: 'History',
				icon: <AssessmentIcon />,
				path: '/logistics/inventory/history',
			},
			{
				text: 'Categories',
				icon: <AssignmentIcon />,
				path: '/logistics/inventory/categories',
			},
		],
	},
	{
		text: 'Logout',
		icon: <LogoutIcon />,
		path: '/logout',
	},
];


const LogisticsManagerDashboard = () => {
	const [openMenus, setOpenMenus] = useState({});

	const handleSidebarMenuClick = (text) => {
		setOpenMenus((prev) => ({ ...prev, [text]: !prev[text] }));
	};

	const handleMenuClick = (item) => {
		if (item.submenu) {
			handleSidebarMenuClick(item.text);
		} else {
			window.location.pathname = item.path;
		}
	};

	return (
		<Box sx={{ display: 'flex' }}>
			<AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
				<Toolbar>
					<Typography variant="h6" noWrap component="div">
						Logistics/Stores Manager Dashboard
					</Typography>
				</Toolbar>
			</AppBar>
			<Drawer
				variant="permanent"
				sx={{
					width: drawerWidth,
					flexShrink: 0,
					[`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
				}}
			>
				<Toolbar />
				<List>
					{sidebarMenu.map((item) => (
						<React.Fragment key={item.text}>
							<ListItem button onClick={() => handleMenuClick(item)}>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.text} />
								{item.submenu ? (openMenus[item.text] ? <ExpandLess /> : <ExpandMore />) : null}
							</ListItem>
							{item.submenu && (
								<Collapse in={openMenus[item.text]} timeout="auto" unmountOnExit>
									<List component="div" disablePadding>
										{item.submenu.map((sub) => (
											<ListItem button key={sub.text} sx={{ pl: 4 }} onClick={() => window.location.pathname = sub.path}>
												<ListItemIcon>{sub.icon}</ListItemIcon>
												<ListItemText primary={sub.text} />
											</ListItem>
										))}
									</List>
								</Collapse>
							)}
						</React.Fragment>
					))}
				</List>
			</Drawer>
			<Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
				<Toolbar />
				{/* Main dashboard content goes here */}
				<Typography variant="h4" gutterBottom>
					Welcome, Logistics/Stores Manager!
				</Typography>
				<Typography>
					Use the sidebar to navigate between Dashboard, Inventory, Requests, and Reports.
				</Typography>
			</Box>
		</Box>
	);
};

export default LogisticsManagerDashboard;