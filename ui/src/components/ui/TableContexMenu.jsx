"use client";
import { useRef } from "react";
import React, { useState, useEffect } from "react";
import { ContextMenu } from "../../styles/styles";

export default function TableContexMenu({ title, key }) {
  const fileInput = useRef(null);

  return (
    <>
      <ContextMenu key={key}>{title}</ContextMenu>
    </>
  );
}
