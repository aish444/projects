<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xs="http://www.w3.org/2001/XMLSchema"
  exclude-result-prefixes="xs"
>

  <!-- Output HTML -->
  <xsl:output method="html" indent="yes" />

  <!-- Match the root element (books) -->
  <xsl:template match="/books">
    <html>
      <head>
        <title>Book List</title>
        <style>
          table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 14px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>Book List</h1>
        <table>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Price</th>
            <th>In Stock</th>
            <th>Publisher</th>
            <th>Publication Date</th>
          </tr>
          <xsl:apply-templates select="book" />
        </table>
      </body>
    </html>
  </xsl:template>

  <!-- Match each book element -->
  <xsl:template match="book">
    <tr>
      <td><xsl:value-of select="@id" /></td>
      <td><xsl:value-of select="title" /></td>
      <td><xsl:value-of select="author/firstName" /> <xsl:value-of select="author/lastName" /></td>
      <td><xsl:value-of select="genre" /></td>
      <td><xsl:value-of select="price" /></td>
      <td><xsl:value-of select="inStock" /></td>
      <td><xsl:value-of select="publisher/name" /> (<xsl:value-of select="publisher/location" />)</td>
      <td><xsl:value-of select="publicationDate" /></td>
    </tr>
  </xsl:template>

</xsl:stylesheet>