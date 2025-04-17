import styled, { css } from "styled-components";

export const ContextMenu = styled.div`
  position: absolute;
  width: 220px;
  background-color: #1f2937;
  border-radius: 8px;
  box-sizing: border-box;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  ${({ $top, $left }) => css`
    top: ${$top}px;
    left: ${$left}px;
  `}
  ul {
    box-sizing: border-box;
    padding: 8px;
    margin: 0;
    list-style: none;
  }
  ul li {
    padding: 8px 12px;
    margin: 2px 0;
    border-radius: 4px;
    color: #e5e7eb;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  /* hover */
  ul li:hover {
    cursor: pointer;
    background-color: #374151;
    color: #ffffff;
  }
  /* header */
  div.text-center {
    padding: 12px;
    font-weight: 500;
    color: #f3f4f6;
    border-bottom: 1px solid #374151;
  }
  /* coordinates */
  div:not(.text-center) {
    padding: 8px 12px;
    font-size: 12px;
    color: #9ca3af;
    border-bottom: 1px solid #374151;
  }
  /* separator */
  hr {
    border: none;
    border-top: 1px solid #374151;
    margin: 0;
  }
`;
