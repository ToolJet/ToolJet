import { QueryError, QueryResult, QueryService, ConnectionTestResult } from '@tooljet-plugins/common';
import { SourceOptions, QueryOptions } from './types';
import nodemailer from 'nodemailer';

export default class Smtp_server implements QueryService {
  async run(sourceOptions: SourceOptions, queryOptions: QueryOptions, dataSourceId: string): Promise<QueryResult> {
    const nodemailerTransport = await this.getConnection(sourceOptions);

    const from = queryOptions.from;
    const to = queryOptions.to;
    const subject = queryOptions.subject;
    const contentType = queryOptions.content_type;
    const content = queryOptions.content;
    
    const mailOptions = {
      from,
      to,
      subject,
      text: contentType == 'plain_text' && content,
      html: contentType == 'html' && content
    };
 
    try {
      await new Promise((resolve,reject)=>nodemailerTransport.sendMail(mailOptions, (err:any,success:any)=>{
        if(err){
          reject(err);
        }
        resolve(success);
      }));
    }catch(error){
      console.log(error);
      throw new QueryError('Query could not be completed', error.message, {});
    }

    return {
      status: 'ok',
      data: {},
    };
  }

  async testConnection(sourceOptions: SourceOptions): Promise<ConnectionTestResult> {
    const transporter = await this.getConnection(sourceOptions);
  
    if (!transporter) {
      throw new Error('Invalid credentials');
    }

    try{
      await new Promise((resolve,reject)=>{
        transporter.verify(function (error:any, success:any) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Server is ready to take our messages");
            resolve(success);
          }
        }
      )});
    }catch(err){
      throw new Error('Invalid credentials');
    }
    
    return {
      status: 'ok',
    };
  }

  async getConnection(sourceOptions: SourceOptions, _options?: object): Promise<any> {
    const host = sourceOptions.host;
    const port = Number(sourceOptions.port);
    const user = sourceOptions.user;
    const pass = sourceOptions.password;
    
    let transport = nodemailer.createTransport({
      port,
      host,
      secure: port == 465,
      auth: {
        user,
        pass,
      }
    });
    
    return transport;
  }
}
