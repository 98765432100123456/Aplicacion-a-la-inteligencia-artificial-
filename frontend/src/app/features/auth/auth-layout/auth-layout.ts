import { Component } from '@angular/core';
import { Logo } from '../../../shared/components/logo/logo';
import { PieLegal } from '../../../shared/components/pie-legal/pie-legal';
import { SelectorTema } from '../../../shared/components/selector-tema/selector-tema';

/**
 * Marco de ingreso y recuperación. A la izquierda, el héroe oscuro muestra el
 * producto (mostrar antes de prometer); a la derecha, el formulario.
 */
@Component({
  selector: 'app-auth-layout',
  imports: [Logo, SelectorTema, PieLegal],
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.scss',
})
export class AuthLayout {}
