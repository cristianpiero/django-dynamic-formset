/**
 * jQuery Formset 1.2
 * @author Stanislaus Madueke (stan DOT madueke AT gmail DOT com)
 * @requires jQuery 1.2.6 or later
 *
 * Copyright (c) 2009, Stanislaus Madueke
 * All rights reserved.
 *
 * Licensed under the New BSD License
 * See: http://www.opensource.org/licenses/bsd-license.php
 */
;(function($) {
    $.fn.formset = function(opts)
    {
        var options = $.extend({}, $.fn.formset.defaults, opts),
            flatExtraClasses = options.extraClasses.join(' '),
            $$ = $(this),

            applyExtraClasses = function(row, ndx) {
                if (options.extraClasses) {
                    row.removeClass(flatExtraClasses);
                    row.addClass(options.extraClasses[ndx % options.extraClasses.length]);
                }
            },

            updateElementIndex = function(elem, prefix, ndx) {
                var idRegex = new RegExp('(' + prefix + '-\\d+-)|(^)'),
                    replacement = prefix + '-' + ndx + '-';
                if (elem.attr("for")) elem.attr("for", elem.attr("for").replace(idRegex, replacement));
                if (elem.attr('id')) elem.attr('id', elem.attr('id').replace(idRegex, replacement));
                if (elem.attr('name')) elem.attr('name', elem.attr('name').replace(idRegex, replacement));
                if (elem.attr('data-id')) elem.attr('data-id', elem.attr('data-id').replace(idRegex, replacement));
            },

            hasChildElements = function(row) {
                return row.find('input,select,textarea,label,a').length > 0;
            },

            insertDeleteLink = function(row) {
                if (row.is('TR')) {
                    // If the forms are laid out in table rows, insert
                    // the remove button into the last table cell:
                    row.children(':last').append('<a class="' + options.deleteCssClass +'" href="javascript:void(0)">' + options.deleteText + '</a>');
                } else if (row.is('UL') || row.is('OL')) {
                    // If they're laid out as an ordered/unordered list,
                    // insert an <li> after the last list item:
                    row.append('<li><a class="' + options.deleteCssClass + '" href="javascript:void(0)">' + options.deleteText +'</a></li>');
                } else {
                    // Otherwise, just insert the remove button as the
                    // last child element of the form's container:
                    //row.append('<a class="' + options.deleteCssClass + '" href="javascript:void(0)">' + options.deleteText +'</a>');

                    //Procura o checkbox de delete e insere o botão de delete antes
                    //assim agora pode colocar o botão onde quiser
                    //by Cristian Piero
                    var btndel = row.find('input:checkbox[id $= "-DELETE"]');
                    if (btndel.length) {
                        btndel.before('<a class="' + options.deleteCssClass + '" href="javascript:void(0)">' + options.deleteText +'</a>');                        
                    }
                    
                }
                //options.deleteCssClass = options.deleteCssClass.split(' ')
                //console.log(deleteCssClassMultiple[0]);
                row.find('a.' + options.deleteCssClass.split(' ')[0]).click(function() {                    
                    var row = $(this).parents('.' + options.formCssClass),
                        del = row.find('input:hidden[id $= "-DELETE"]');
                    if (del.length) {
                        // We're dealing with an inline formset; rather than remove
                        // this form from the DOM, we'll mark it as deleted and hide
                        // it, then let Django handle the deleting:
                        del.val('on');
                        row.hide();
                    } else {
                        row.remove();
                        // Update the TOTAL_FORMS form count.
                        // Also update names and IDs for all remaining form controls so they remain in sequence:
                        var forms = $('.' + options.formCssClass).not('.formset-custom-template');
                        $('#id_' + options.prefix + '-TOTAL_FORMS').val(forms.length);
                        for (var i=0, formCount=forms.length; i<formCount; i++) {
                            applyExtraClasses(forms.eq(i), i);
                            forms.eq(i).find('input,select,textarea,label,a').each(function() {
                                updateElementIndex($(this), options.prefix, i);
                            });
                        }
                    }
                    // If a post-delete callback was provided, call it with the deleted form:
                    if (options.removed) options.removed(row);
                    return false;
                });
            };

        $$.each(function(i) {
            var row = $(this),
                del = row.find('input:checkbox[id $= "-DELETE"]');
            if (del.length) {
                // If you specify "can_delete = True" when creating an inline formset,
                // Django adds a checkbox to each form in the formset.
                // Replace the default checkbox with a hidden field:
                del.before('<input type="hidden" name="' + del.attr('name') +'" id="' + del.attr('id') +'" />');                
                del.remove();
            }
            if (hasChildElements(row)) {
                insertDeleteLink(row);
                row.addClass(options.formCssClass);
                applyExtraClasses(row, i);
            }
        });

        if ($$.length) {
            var addButton, template;
            if (options.formTemplate) {
                // If a form template was specified, we'll clone it to generate new form instances:
                template = (options.formTemplate instanceof $) ? options.formTemplate : $(options.formTemplate);
                template.removeAttr('id').addClass(options.formCssClass).addClass('formset-custom-template');
                template.find('input,select,textarea,label,a').each(function() {
                    updateElementIndex($(this), options.prefix, 2012);
                });
                insertDeleteLink(template);
            } else {
                // Otherwise, use the last form in the formset; this works much better if you've got
                // extra (>= 1) forms (thnaks to justhamade for pointing this out):
                template = $('.' + options.formCssClass + ':last').clone(true).removeAttr('id');
                template.find('input:hidden[id $= "-DELETE"]').remove();
                template.find('input,select,textarea,label,a').each(function() {
                    var elem = $(this);
                    // If this is a checkbox or radiobutton, uncheck it.
                    // This fixes Issue 1, reported by Wilson.Andrew.J:
                    if (elem.is('input:checkbox') || elem.is('input:radio')) {
                        elem.attr('checked', false);
                    } else {
                        elem.val('');
                    }
                });
            }
            // FIXME: Perhaps using $.data would be a better idea?
            options.formTemplate = template;

            if ($$.prop('tagName') == 'TR') {
                // If forms are laid out as table rows, insert the
                // "add" button in a new table row:
                var numCols = $$.eq(0).children().length;
                $$.parent().append('<tr><td colspan="' + numCols + '"><a class="' + options.addCssClass + '" href="javascript:void(0)">' + options.addText + '</a></tr>');
                addButton = $$.parent().find('tr:last a');
                addButton.parents('tr').addClass(options.formCssClass + '-add');
            } else {
                // Otherwise, insert it immediately after the last form:
                //$$.filter(':last').after('<a class="' + options.addCssClass + '" href="javascript:void(0)">' + options.addText + '</a>');
                //addButton = $$.filter(':last').next();
                addButton = $('.ADD-'+options.prefix).html('<a class="' + options.addCssClass + '" href="javascript:void(0)">' + options.addText + '</a>');
            }   
            addButton.click(function() {
                var formCount = parseInt($('#id_' + options.prefix + '-TOTAL_FORMS').val()),
                    row = options.formTemplate.clone(true).removeClass('formset-custom-template'),
                    buttonRow = $(this).parents('tr.' + options.formCssClass + '-add').get(0) || this;
                applyExtraClasses(row, formCount);
                row.insertBefore($(buttonRow)).show();
                row.find('input,select,textarea,label,a').each(function() {
                    updateElementIndex($(this), options.prefix, formCount);
                });
                $('#id_' + options.prefix + '-TOTAL_FORMS').val(formCount + 1);
                // If a post-add callback was supplied, call it with the added form:
                if (options.added) options.added(row);
                return false;
            });
        }

        return $$;
    }

    /* Setup plugin defaults */
    $.fn.formset.defaults = {
        prefix: 'form',                  // The form prefix for your django formset
        formTemplate: null,              // The jQuery selection cloned to generate new form instances
        addText: 'add another',          // Text for the add link
        deleteText: 'remove',            // Text for the delete link
        addCssClass: 'add-row',          // CSS class applied to the add link
        deleteCssClass: 'delete-row',    // CSS class applied to the delete link
        formCssClass: 'dynamic-form',    // CSS class applied to each form in a formset
        extraClasses: [],                // Additional CSS classes, which will be applied to each form in turn
        added: null,                     // Function called each time a new form is added
        removed: null                    // Function called each time a form is deleted

    };
})(jQuery)
