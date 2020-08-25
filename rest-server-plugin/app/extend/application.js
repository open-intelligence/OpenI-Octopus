module.exports = {
  disableFileLoggers(){
    for(const logger of this.loggers.values()){
      const fileTransport = logger.get('file');
      if(fileTransport){
        fileTransport.disable()
      }
    }
  },
}