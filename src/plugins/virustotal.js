export const virustotalOptions = (method, url = null) => {
  const options = {
    headers: {
      accept: "application/json",
      "x-apikey":
        "7e580ce5a657a49226edb9b58790914878649fe7d4185555dbc9470c7bce7215",
    },
  };

  if (method === "POST") {
    options.method = "POST";
    options.headers["content-type"] = "application/x-www-form-urlencoded";
    options.body = new URLSearchParams({ url });
  } else if (method === "GET") options.method = "GET";

  return options;
};
