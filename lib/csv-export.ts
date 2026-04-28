export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error("No data available to export");
  }

  // Flatten function for nested objects
  const flatten = (obj: any, prefix = ""): any => {
    return Object.keys(obj).reduce((acc: any, k: string) => {
      const pre = prefix.length ? prefix + "_" : "";
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
        Object.assign(acc, flatten(obj[k], pre + k));
      } else {
        acc[pre + k] = obj[k];
      }
      return acc;
    }, {});
  };

  const flattenedData = data.map((row) => flatten(row));
  const headers = Object.keys(flattenedData[0]).join(",");
  
  const rows = flattenedData.map((row) => {
    return Object.keys(flattenedData[0])
      .map((header) => {
        const value = row[header];
        const str = value === null || value === undefined ? "" : String(value);
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",");
  });

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
