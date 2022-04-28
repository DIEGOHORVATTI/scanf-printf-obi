/*
################################################################################################################### 
# prenode.js                                                                                                      #
# todos os modulos que podem ser usados(printf, fprintf, sprintf, scanf, sscanf) | modulos usados(scanf, printf ) #   
# type de arquivo suportado a import(mjs)                                                                         #
################################################################################################################### 
*/

// stub to include printf and scanf in javascript programs
import { printf, fprintf, sprintf, scanf, sscanf } from "../lib/index.js";
// end of stub

// append your script here

printf("%d\n", 1000);

printf("Digite o valor de s: ");
const input = scanf("%s");

printf("Valor do input '%s' ok\n", input);