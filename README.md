##testing file upload with multer and express in nodejs

##running
1. is straight forward `npm install && npm start`
2. and then comes the nginx part, make sure youu have nginx installed.
3. copy the configuration to `/etc/nginx/sites-available/` and symlink to `/etc/nginx/sites-available/`
4. you could use whatever servername you prefer,if tested locally add it to /etc/hosts or dnsmasq and restart nginx

##problems faced
(includes the parts where I am a moron)

1. choosing a front end framework. (wrote a messy solution of my own with on hash change)
2. trying to upload files using bodyparser (since its provided by express generator as default). (bodyparse is not meant for multipart data, so RTFM)
3. uploading multipart with ajax.

    I set the content type to `multipart/formdata` but for a multipart form the content type also needs a boundary.
    ```
      Accept:*/*
      Accept-Language:en-US,en;q=0.8
      Connection:keep-alive
      Content-Length:324726
      Content-Type:multipart/form-data; boundary=----WebKitFormBoundary0Tie6feGSPtp6vjP
      Request Payload
      ------WebKitFormBoundary0Tie6feGSPtp6vjP
      Content-Disposition: form-data; name="files[]"; filename="bd8.jpg"
      Content-Type: image/jpeg


      ------WebKitFormBoundary0Tie6feGSPtp6vjP
      Content-Disposition: form-data; name="files[]"; filename="bubbles.jpeg"
      Content-Type: image/jpeg


      ------WebKitFormBoundary0Tie6feGSPtp6vjP--
    ```

    is a sample (relevant parts) of the multipart data submission. without the `boundary` part in the content-type,
    parser doesn't parse form data since `Boundary not found`

4. using `multer` with express.Router() (<a href="http://expressjs.com/guide/using-middleware.html#middleware.third-party">RTFM</a> strikes again)
5. related to above two, the name `files[]` in the Request payload (i.e the `input(name=files[]`) or `formData.append('files[]', fileData)`) should match `multer({...options}).array('files[]')`, and since that, I don't wish to use `files[]` rather that I would like something cooler, `avatars`.
