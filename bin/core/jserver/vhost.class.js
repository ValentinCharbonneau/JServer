module.exports = {
    vhost: class vhost {
            constructor() {
                this.protocol = 'http';
                this.port = 80;
        
                this.fqdn = 'localhost';
                this.file = './';
        
                this.certificate = '';
                this.key = '';

                this.internalPort;
            }
        }
}
