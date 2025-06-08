import Tabletools from './tableTools';

describe('Tabletools.contentToNodes', () => {

  it('should handle simple tables with thead and th elements', () => {
    const html = `
      <table>
        <thead>
          <tr><th>Name</th><th>Age</th></tr>
        </thead>
        <tbody>
          <tr><td>John</td><td>30</td></tr>
          <tr><td>Jane</td><td>25</td></tr>
        </tbody>
      </table>
    `;
    const expected = [
      ['Name', 'Age'],
      ['John', '30'],
      ['Jane', '25'],
    ];
    expect(Tabletools.contentToNodes([html])).toEqual(expected);
  });

  it('should handle tables with colspan attributes', () => {
    const html = `
      <table>
        <tr><th colspan="2">Full Name</th><th>Age</th></tr>
        <tr><td>John</td><td>Doe</td><td>30</td></tr>
        <tr><td>Jane</td><td>Smith</td><td>25</td></tr>
      </table>
    `;
    const expected = [
      ['Full Name', 'Full Name', 'Age'],
      ['John', 'Doe', '30'],
      ['Jane', 'Smith', '25'],
    ];
    expect(Tabletools.contentToNodes([html])).toEqual(expected);
  });

  it('should handle tables with rowspan attributes', () => {
    const html = `
      <table>
        <tr><th>Name</th><td>John</td></tr>
        <tr><th rowspan="2">Phone</th><td>123-456</td></tr>
        <tr><td>789-012</td></tr>
      </table>
    `;
    const expected = [
      ['Name', 'John'],
      ['Phone', '123-456'],
      ['Phone', '789-012'],
    ];
    expect(Tabletools.contentToNodes([html])).toEqual(expected);
  });
  
  it('should handle complex tables with rowspan and colspan', () => {
    const html = `
      <table>
        <thead>
          <tr>
            <th rowspan="2">ID</th>
            <th colspan="2">Name</th>
            <th rowspan="2">Age</th>
          </tr>
          <tr>
            <th>First</th>
            <th>Last</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td>John</td>
            <td>Doe</td>
            <td>30</td>
          </tr>
          <tr>
            <td>2</td>
            <td colspan="2">Jane Smith</td>
            <td>25</td>
          </tr>
        </tbody>
      </table>
    `;
    const expected = [
      ['ID', 'Name', 'Name', 'Age'],
      ['ID', 'First', 'Last', 'Age'],
      ['1', 'John', 'Doe', '30'],
      ['2', 'Jane Smith', 'Jane Smith', '25'],
    ];
    expect(Tabletools.contentToNodes([html])).toEqual(expected);
  });

  it('should return a default message for invalid or empty content', () => {
    const emptyMsg = [["table is empty or does not include a valid html <table> tag"]];
    expect(Tabletools.contentToNodes(null)).toEqual(emptyMsg);
    expect(Tabletools.contentToNodes([])).toEqual(emptyMsg);
    expect(Tabletools.contentToNodes([null])).toEqual(emptyMsg);

    const invalidContent = '<div>Just a div</div>';
    const result = Tabletools.contentToNodes([invalidContent]);
    const expectedInvalid = [
        ["table is empty or does not include a valid html <table> tag"],
        ["--- Here an extract of the document ---"],
        [invalidContent.slice(0, 300) + "..."]
    ];
    expect(result).toEqual(expectedInvalid);
  });

}); 