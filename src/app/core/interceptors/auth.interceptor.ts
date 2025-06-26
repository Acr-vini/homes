import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // 2. Lógica de Tratamento de Erro
    // O pipe com catchError lida com respostas de erro do servidor.
    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Se o erro for 401 (Unauthorized) ou 403 (Forbidden), significa que o token
        // é inválido ou expirou. A melhor ação é deslogar o usuário.
        if (error.status === 401 || error.status === 403) {
          this.auth.logout();
        }
        // Re-lança o erro para que o serviço que fez a chamada original
        // também possa tratá-lo (ex: exibir uma mensagem de erro).
        return throwError(() => error);
      })
    );
  }
}
