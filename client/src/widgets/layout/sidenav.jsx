import React from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Button,
  IconButton,
  Typography,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const [open, setOpen] = React.useState(0);

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };

  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const activeColor = sidenavColor === "dark" ? "blue-gray" : sidenavColor;

  return (
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >
      <div className="relative">
        <Link to="/" className="py-6 px-8 text-center">
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            {brandName}
          </Typography>
        </Link>
        <IconButton
          variant="text"
          color="white"
          size="sm"
          ripple={false}
          className="absolute right-0 top-0 grid rounded-br-none rounded-tl-none xl:hidden"
          onClick={() => setOpenSidenav(dispatch, false)}
        >
          <XMarkIcon strokeWidth={2.5} className="h-5 w-5 text-white" />
        </IconButton>
      </div>
      <div className="m-4">
        {routes.map(({ layout, pages }, key) => (
          <ul key={key} className="mb-4 flex flex-col gap-1">
            {pages
              .filter((page) => page.name) // <-- FILTER: Hanya render halaman yang punya 'name'
              .map(({ icon, name, path, subRoutes }, pageKey) => (
              <li key={name}> {/* <-- KEY: Menambahkan 'key' unik */}
                {subRoutes ? (
                  <Accordion
                    open={open === pageKey + 1}
                    icon={
                      <ChevronDownIcon
                        strokeWidth={2.5}
                        className={`mx-auto h-4 w-4 transition-transform text-${sidenavType === "dark" ? "white" : "blue-gray"} ${
                          open === pageKey + 1 ? "rotate-180" : ""
                        }`}
                      />
                    }
                  >
                    <AccordionHeader
                      onClick={() => handleOpen(pageKey + 1)}
                      className="p-0 border-b-0"
                    >
                       <div
                        className={`flex items-center gap-4 px-4 capitalize font-medium w-full rounded-lg hover:bg-blue-gray-500/10 text-${sidenavType === "dark" ? "white" : "blue-gray"}`}
                      >
                        {icon}
                        <Typography color="inherit" className="font-medium capitalize">{name}</Typography>
                       </div>
                    </AccordionHeader>
                    <AccordionBody className="py-1">
                      <ul className="flex flex-col gap-1 pl-4">
                        {subRoutes.map(
                          ({
                            icon: subIcon,
                            name: subName,
                            path: subPath,
                          }) => (
                            <li key={subName}>
                              <NavLink to={`/${layout}${subPath}`}>
                                {({ isActive }) => (
                                  <Button
                                    variant={isActive ? "gradient" : "text"}
                                    color={
                                      isActive
                                        ? activeColor
                                        : sidenavType === "dark"
                                        ? "white"
                                        : "blue-gray"
                                    }
                                    className="flex items-center gap-4 px-4 capitalize"
                                    fullWidth
                                  >
                                    {subIcon}
                                    <Typography
                                      color="inherit"
                                      className="font-medium capitalize"
                                    >
                                      {subName}
                                    </Typography>
                                  </Button>
                                )}
                              </NavLink>
                            </li>
                          )
                        )}
                      </ul>
                    </AccordionBody>
                  </Accordion>
                ) : (
                  <NavLink to={`/${layout}${path}`}>
                    {({ isActive }) => (
                      <Button
                        variant={isActive ? "gradient" : "text"}
                        color={
                          isActive
                            ? activeColor
                            : sidenavType === "dark"
                            ? "white"
                            : "blue-gray"
                        }
                        className="flex items-center gap-4 px-4 capitalize"
                        fullWidth
                      >
                        {icon}
                        <Typography
                          color="inherit"
                          className="font-medium capitalize"
                        >
                          {name}
                        </Typography>
                      </Button>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </aside>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Material Tailwind React",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidenav.jsx";

export default Sidenav;