"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { MenuContextContainer } from "../../styles/styles";

export default function TableContexMenu( { title, key } ) {

  const fileInput = useRef(null);

  return (
    <>
      <MenuContextContainer key={key}>{title}</MenuContextContainer>
    </>
  );
}