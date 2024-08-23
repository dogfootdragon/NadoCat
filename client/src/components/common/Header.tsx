import React from "react";
import logoHeader from "../../assets/img/logoHeader.png";
import { BiBell } from "react-icons/bi";
import "../../styles/css/base/reset.css";
import "../../styles/scss/components/common/header.scss";
import { Link } from "react-router-dom";
import NotificationAlarm from "./NotificationAlarm";

export const Header: React.FC = () => {
  return (
    <>
      <header>
        <h1 className="logo">
          <Link to="/">
            <img src={logoHeader} alt="logo-header" />
          </Link>
        </h1>

        <button className="alarm-button">
          <a href="/notification">
            <NotificationAlarm />
          </a>
        </button>
      </header>
    </>
  );
};
