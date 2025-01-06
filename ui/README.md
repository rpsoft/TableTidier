

- [] Move away the traverse function
- [] Should all tables be converted to 2D arrays on import? , and then just work with 2D arrays?
-- [] One thing against, is that then no editing of the HTML would be allowed. So a valid page will be always expected.
-- [] However editing will be much easier as we do not have to deal with html anymore until an export

- Implement:
-- Table editing functions
-- Annotation of rows and columns, how are we going to action this intuitively?
I say, users can select whole rows, columns, and assign a tag, or select one or multiple cells (shift click?) and assign tag.

Language shift: tagging vs annotating?
Tagging, telling what the cell/rows/columns are.
Annotating, associating cells/rows/columns with concepts based on their content.

- Both can be automatised. Distinguish user assigned from machine assigned. Then we can be fancy about it. Assign auto annotations to all?


-- ad tabs to select full row, or full column!s
selecting rows where content is similarly formatted. We can encode continuous text, to <text>, continuous numbers to <number>,
and compare content checking if formatting cues are sufficiently similar.

-- Can we color code associations? Parent concept, less transparency, child concept more transparency?. Color indicates the grouping?.
-- We need an infinitely big palette.

-- Select Unassigned (tab): select those headings that have not been associated in a grouping.

-- operate changed on the tableNodes variable, and store this away. We can always then reset it, by re-reading the HTML into nodes.
