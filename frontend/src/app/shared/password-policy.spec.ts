import { FormControl, FormGroup } from '@angular/forms';
import { matchFields, passwordPolicy } from './password-policy';

describe('Política de contraseñas', () => {
  it('exige 10 caracteres con letras y números', () => {
    expect(passwordPolicy(new FormControl('corta1'))).toEqual({ policy: true });
    expect(passwordPolicy(new FormControl('solamenteletras'))).toEqual({ policy: true });
    expect(passwordPolicy(new FormControl('1234567890'))).toEqual({ policy: true });
    expect(passwordPolicy(new FormControl('Ganaderia2026'))).toBeNull();
  });

  it('detecta confirmaciones distintas', () => {
    const group = new FormGroup(
      { a: new FormControl('Ganaderia2026'), b: new FormControl('Ganaderia2027') },
      { validators: matchFields('a', 'b') },
    );
    expect(group.hasError('mismatch')).toBeTrue();
    group.controls.b.setValue('Ganaderia2026');
    expect(group.hasError('mismatch')).toBeFalse();
  });
});
